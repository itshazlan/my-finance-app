import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private logger = new Logger(TelegramService.name);
  private genAI: GoogleGenAI;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    }

    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  onModuleInit() {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set. Bot is disabled.');
      return;
    }
    if (!this.genAI) {
      this.logger.warn('GEMINI_API_KEY is not set. Image scanning will not work.');
    }

    this.setupBot();

    this.bot.launch().then(() => {
      this.logger.log('Telegram bot is up and running!');
    }).catch(err => {
      this.logger.error('Failed to start Telegram Bot', err);
    });

    // Handle graceful stop
    process.once('SIGINT', () => this.bot?.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
  }

  private setupBot() {
    this.bot.start((ctx) => {
      ctx.reply(`Halo! Selamat datang di Bot Personal Finance Tracker. 💸\nUntuk mulai menggunakan bot ini, jalankan perintah:\n/link <email_kamu>\nContoh: /link budi@gmail.com`);
    });

    this.bot.command('link', async (ctx) => {
      const email = ctx.message.text.split(' ')[1];
      if (!email) {
        return ctx.reply('Format salah. Gunakan: /link <email_kamu>');
      }

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        return ctx.reply('Email tidak ditemukan di database kami.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: ctx.from.id.toString() }
      });

      return ctx.reply(`Sukses! Akun Telegram kamu telah dikaitkan dengan email ${email}. Sekarang kamu cukup mengirimkan foto struk belanja ke bot ini! Untuk melihat ringkasan bulan ini, ketik /rekap`);
    });

    this.bot.command('rekap', async (ctx) => {
      const chatId = ctx.from.id.toString();
      const user = await this.prisma.user.findUnique({ where: { telegramChatId: chatId } });
      if (!user) return ctx.reply('Akun kamu belum dikaitkan. Jalankan /link <email_kamu> terlebih dahulu.');

      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      await this.sendRecapToUser(user, firstDay, lastDay, `Bulan Ini`);
    });

    this.bot.on('photo', async (ctx) => {
      if (!this.genAI) {
        return ctx.reply('Sistem AI belum dikonfigurasi (GEMINI_API_KEY missing).');
      }

      const chatId = ctx.from.id.toString();
      const user = await this.prisma.user.findUnique({
        where: { telegramChatId: chatId },
        include: { categories: true }
      });

      if (!user) {
        return ctx.reply('Akun kamu belum dikaitkan. Jalankan /link <email_kamu> terlebih dahulu.');
      }

      const processingMessage = await ctx.reply('Menganalisis struk kamu dengan AI... ⏳');

      try {
        const photos = ctx.message.photo;
        const highestResPhoto = photos[photos.length - 1]; // get highest resolution
        const fileLink = await ctx.telegram.getFileLink(highestResPhoto.file_id);

        // Cukup gunakan native fetch (node >= 18)
        const imageResponse = await fetch(fileLink.href);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = 'image/jpeg';

        // Persiapkan data kategori pengguna agar AI bisa memilih dengan tepat
        const categoriesList = user.categories
          .filter(c => c.type === 'EXPENSE')
          .map(c => `- ${c.name} (ID: ${c.id})`)
          .join('\n');

        const prompt = `Aku memberikan sebuah foto struk belanja / transaksi.
Tolong ekstrak informasi berikut dan kembalikan HANYA dalam format JSON valid tanpa format markdown \`\`\`:
1. "amount": total akhir transaksi (angka integer murni tanpa titik atau huruf, contoh: 50000).
2. "description": rangkuman tempat belanja dan isi item (contoh: "Alfamart - Susu, Roti, Kopi").
3. "date": tanggal transaksi (format ISO 8601). Jika tidak terdeteksi pakai waktu saat ini.
4. "categoryId": pilih ID kategori yang paling masuk akal dari list berikut untuk transaksi pengeluaran ini:
${categoriesList}
Jika tidak ada yang cocok atau list kosong, biarkan categoryId null.`;

        const response = await this.genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: buffer.toString("base64"),
                    mimeType
                  }
                }
              ]
            }
          ]
        });

        const responseText = response.text || "";
        const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedJson);

        if (!data.amount) {
          return ctx.telegram.editMessageText(ctx.chat.id, processingMessage.message_id, undefined, 'Gagal mendeteksi jumlah uang pada struk. Mohon coba foto yang lebih jelas.');
        }

        // Cari default category (jika AI gagal atau tidak ada)
        let categoryId = data.categoryId;
        if (!categoryId) {
          const firstCategory = await this.prisma.category.findFirst({
            where: { userId: user.id, type: 'EXPENSE' }
          });
          if (firstCategory) categoryId = firstCategory.id;
        }

        // Jika dia masih belum punya kategori
        if (!categoryId) {
          const defaultCategory = await this.prisma.category.create({
            data: {
              name: 'Umum (Bot)',
              type: 'EXPENSE',
              userId: user.id
            }
          });
          categoryId = defaultCategory.id;
        }

        // Membuat data transaksi
        await this.prisma.transaction.create({
          data: {
            amount: data.amount,
            description: data.description,
            date: new Date(), // Selalu gunakan waktu saat ini agar masuk perhitungan dashboard bulan ini
            type: 'EXPENSE',
            userId: user.id,
            categoryId: categoryId
          }
        });

        const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.amount);
        ctx.telegram.editMessageText(ctx.chat.id, processingMessage.message_id, undefined,
          `✅ Transaksi berhasil dicatat!\n\n💳 Nominal: ${formattedAmount}\n📝 Info: ${data.description}\n\nSilakan cek website Dashboard Anda di https://my-finance-app-web.vercel.app!`);

      } catch (error) {
        this.logger.error(error);
        ctx.telegram.editMessageText(ctx.chat.id, processingMessage.message_id, undefined, 'Terjadi kesalahan saat memproses gambar. Pastikan API key Google Gemini aktif atau format foto struk benar.');
      }
    });

    // ─── Handler: Teks Bebas → Transaksi ───
    this.bot.on('text', async (ctx) => {
      // Abaikan jika pesan adalah sebuah perintah (dimulai dengan /)
      const text = ctx.message.text;
      if (text.startsWith('/')) return;

      if (!this.genAI) {
        return ctx.reply('⚠️ Fitur input teks belum tersedia (GEMINI_API_KEY belum dikonfigurasi).');
      }

      const chatId = ctx.from.id.toString();
      const user = await this.prisma.user.findUnique({
        where: { telegramChatId: chatId },
        include: { categories: true },
      });

      if (!user) {
        return ctx.reply('Akun kamu belum dikaitkan. Jalankan /link <email_kamu> terlebih dahulu.');
      }

      const processingMsg = await ctx.reply('⏳ Memproses...');

      try {
        const categoriesList = user.categories
          .map(c => `- ${c.name} (ID: ${c.id}, tipe: ${c.type})`)
          .join('\n') || '(tidak ada kategori)';

        const prompt = `Kamu adalah asisten pencatat keuangan pintar.
          Pengguna mengirim pesan teks berikut untuk mencatat transaksi:
          "${text}"

          Perhatikan aturan berikut:
          - Nominal bisa dalam format: 10000, 10rb, 10k, 50ribu, 1jt, 1.5jt, dsb. Konversikan ke angka bulat (integer).
          - Jika tidak ada kata kunci pemasukan ("terima", "gajian", "dapat uang", "income", "masuk"), anggap ini EXPENSE.
          - Jika ada kata kunci pemasukan, set type = "INCOME".
          - Pilih categoryId yang paling sesuai dari daftar kategori pengguna berikut:
          ${categoriesList}
          - Jika tidak ada yang cocok, kembalikan categoryId = null.
          - Buat description yang ringkas dan informatif (maks 60 karakter).

          Kembalikan HANYA JSON valid tanpa markdown, contoh:
          {"amount": 50000, "description": "Beli pulsa", "type": "EXPENSE", "categoryId": "abc-123"}`;

        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const raw = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(raw);

        if (!parsed.amount || parsed.amount <= 0) {
          return ctx.telegram.editMessageText(
            ctx.chat.id, processingMsg.message_id, undefined,
            '❌ Tidak bisa mendeteksi nominal dari pesanmu. Coba format: `Mie instan 15000`',
            { parse_mode: 'Markdown' }
          );
        }

        // Cari atau buat kategori default jika AI tidak menemukan
        let categoryId = parsed.categoryId;
        if (!categoryId) {
          const fallbackCat = await this.prisma.category.findFirst({
            where: { userId: user.id, type: parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE' },
          });
          if (fallbackCat) {
            categoryId = fallbackCat.id;
          } else {
            const newCat = await this.prisma.category.create({
              data: { name: 'Umum (Bot)', type: parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE', userId: user.id },
            });
            categoryId = newCat.id;
          }
        }

        await this.prisma.transaction.create({
          data: {
            amount: parsed.amount,
            description: parsed.description || text.slice(0, 60),
            date: new Date(),
            type: parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
            userId: user.id,
            categoryId,
          },
        });

        const typeEmoji = parsed.type === 'INCOME' ? '🟢 Pemasukan' : '🔴 Pengeluaran';
        const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parsed.amount);

        await ctx.telegram.editMessageText(
          ctx.chat.id, processingMsg.message_id, undefined,
          `✅ *Transaksi Dicatat!*\n\n${typeEmoji}\n💳 Nominal: ${formattedAmount}\n📝 Deskripsi: ${parsed.description}\n\nCek dashboard kamu untuk detail lengkapnya!`,
          { parse_mode: 'Markdown' }
        );

      } catch (err) {
        this.logger.error('Gagal parsing teks transaksi', err);
        ctx.telegram.editMessageText(
          ctx.chat.id, processingMsg.message_id, undefined,
          '❌ Gagal memproses pesanmu. Pastikan format jelas, misal: `Makan siang 25000`',
          { parse_mode: 'Markdown' }
        );
      }
    });
  }

  // Menjalankan Notifikasi Otomatis pada tanggal 1 setiap bulan jam 08:00 Pagi
  @Cron('0 8 1 * *')
  async handleMonthlyRecap() {
    this.logger.log('Memulai job rekap bulanan otomatis...');
    if (!this.bot) return;

    try {
      const users = await this.prisma.user.findMany({
        where: { telegramChatId: { not: null } },
      });

      const today = new Date();
      // Filter transaksi 1 bulan utuh ke belakang
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
      const prevMonthName = firstDay.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      for (const user of users) {
        await this.sendRecapToUser(user, firstDay, lastDay, prevMonthName);
      }
    } catch (err) {
      this.logger.error('Gagal mengirim rekap bulanan otomatis', err);
    }
  }

  private async sendRecapToUser(user: any, start: Date, end: Date, label: string) {
    try {
      const summary = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: { userId: user.id, date: { gte: start, lte: end } },
        _sum: { amount: true },
      });

      const topExpense = await this.prisma.transaction.findFirst({
        where: { userId: user.id, type: 'EXPENSE', date: { gte: start, lte: end } },
        orderBy: { amount: 'desc' },
        include: { category: true }
      });

      let income = 0, expense = 0;
      summary.forEach(s => {
        if (s.type === 'INCOME') income = s._sum.amount || 0;
        if (s.type === 'EXPENSE') expense = s._sum.amount || 0;
      });

      const sisa = income - expense;
      const msg = `📊 *Rekap Keuangan ${label}*\n\n`
        + `Halo ${user.name || 'Bos'}! Berikut rangkuman pergerakan kasmu:\n\n`
        + `🟢 Pemasukan: Rp ${income.toLocaleString('id-ID')}\n`
        + `🔴 Pengeluaran: Rp ${expense.toLocaleString('id-ID')}\n`
        + `💰 Sisa Saldo: Rp ${sisa.toLocaleString('id-ID')}\n\n`
        + (topExpense ? `🔥 *Pengeluaran Jumbo*\n${topExpense.description || topExpense.category.name}: Rp ${topExpense.amount.toLocaleString('id-ID')}\n\n` : '')
        + `Tetap hemat dan semangat! 🚀`;

      await this.bot.telegram.sendMessage(user.telegramChatId, msg, { parse_mode: 'Markdown' });
    } catch (err) {
      this.logger.error(`Gagal mengirim pesan ke user ${user.id}`, err);
    }
  }
}
