import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service.js';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;
  private logger = new Logger(TelegramService.name);
  private genAI: GoogleGenAI;
  private groqApiKey: string;

  constructor(private readonly prisma: PrismaService) {
    if (process.env.TELEGRAM_BOT_TOKEN) {
      this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    }

    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    if (process.env.GROQ_API_KEY) {
      this.groqApiKey = process.env.GROQ_API_KEY;
    }
  }

  onModuleInit() {
    if (!this.bot) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not set. Bot is disabled.');
      return;
    }
    if (!this.genAI && !this.groqApiKey) {
      this.logger.warn('Kedua GEMINI_API_KEY dan GROQ_API_KEY tidak dikonfigurasi. Fitur AI tidak akan bekerja.');
    } else if (!this.genAI) {
      this.logger.warn('GEMINI_API_KEY tidak dikonfigurasi. Menggunakan Groq sebagai AI utama.');
    } else if (!this.groqApiKey) {
      this.logger.warn('GROQ_API_KEY tidak dikonfigurasi. Fallback AI tidak tersedia jika Gemini limit.');
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
    // Daftarkan daftar perintah ke menu Telegram
    this.bot.telegram.setMyCommands([
      { command: 'start',  description: 'Mulai & tampilkan selamat datang' },
      { command: 'link',   description: 'Hubungkan akun: /link email@kamu.com' },
      { command: 'rekap',  description: 'Lihat ringkasan keuangan bulan ini' },
      { command: 'help',   description: 'Tampilkan panduan penggunaan bot' },
    ]).catch(err => {
      this.logger.error('Failed to set Telegram commands (possibly network timeout)', err);
    });

    this.bot.start((ctx) => {
      ctx.reply(
        `👋 Selamat datang di *FinanceTracker Bot!* 💸\n\nBot ini membantu kamu mencatat keuangan langsung dari Telegram - tanpa perlu buka aplikasi.\n\n*Langkah pertama:*\nHubungkan akun kamu dengan perintah:\n/link email@kamu.com\n\nKetik /help untuk melihat semua fitur yang tersedia.`,
        { parse_mode: 'Markdown' }
      );
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(
        `📖 *Panduan Penggunaan FinanceTracker Bot*

        ━━━━━━━━━━━━━━━━━━━
        🔗 *Menghubungkan Akun*
        \` /link email@kamu.com\`
        Wajib dilakukan sekali sebelum fitur lain bisa digunakan.

        ━━━━━━━━━━━━━━━━━━━
        💬 *Catat Transaksi via Teks*
        Cukup kirim pesan biasa, contoh:
        • \`Mie instan 10000\`
        • \`Alfamart - Susu - 15rb\`
        • \`Beli pulsa 50k\`
        • \`Gajian masuk 5jt\` - otomatis tercatat sebagai Pemasukan

        *Tips nominal yang dikenali:*
        10000, 10rb, 10k, 50ribu, 1jt, 1.5jt

        ━━━━━━━━━━━━━━━━━━━
        🧾 *Catat Transaksi via Foto Struk*
        Kirim foto/gambar struk belanja, AI akan membaca dan mencatat otomatis.

        ━━━━━━━━━━━━━━━━━━━
        📊 *Ringkasan Keuangan*
        \` /rekap\`
        Tampilkan pemasukan, pengeluaran & saldo bulan ini.

        ━━━━━━━━━━━━━━━━━━━
        📅 *Notifikasi Otomatis*
        Setiap tanggal 1, bot akan mengirim rekap bulan lalu secara otomatis.

        ━━━━━━━━━━━━━━━━━━━
        Pertanyaan? Cek dashboard: https://my-finance-app-web.vercel.app`,
        { parse_mode: 'Markdown' }
      );
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
      if (!this.genAI && !this.groqApiKey) {
        return ctx.reply('Sistem AI belum dikonfigurasi (GEMINI_API_KEY & GROQ_API_KEY missing).');
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

        const responseText = await this.generateContentWithFallback(prompt, {
          data: buffer.toString('base64'),
          mimeType
        });

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

        // Jika dia masih belum punya kategori sama sekali, gunakan upsert
        if (!categoryId) {
          const defaultCategory = await this.prisma.category.upsert({
            where: { name_userId: { name: 'Umum (Bot)', userId: user.id } },
            update: {},
            create: {
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
        ctx.telegram.editMessageText(ctx.chat.id, processingMessage.message_id, undefined, 'Terjadi kesalahan saat memproses gambar dengan AI. Silakan coba kembali beberapa saat lagi.');
      }
    });

    // ─── Handler: Teks Bebas → Transaksi ───
    this.bot.on('text', async (ctx) => {
      // Abaikan jika pesan adalah sebuah perintah (dimulai dengan /)
      const text = ctx.message.text;
      if (text.startsWith('/')) return;

      if (!this.genAI && !this.groqApiKey) {
        return ctx.reply('⚠️ Fitur input teks belum tersedia (Sistem AI belum dikonfigurasi).');
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

        const responseText = await this.generateContentWithFallback(prompt);

        const raw = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
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
            const catName = parsed.type === 'INCOME' ? 'Umum Pemasukan (Bot)' : 'Umum (Bot)';
            const newCat = await this.prisma.category.upsert({
              where: { name_userId: { name: catName, userId: user.id } },
              update: {},
              create: { name: catName, type: parsed.type === 'INCOME' ? 'INCOME' : 'EXPENSE', userId: user.id },
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

  private async generateContentWithFallback(
    prompt: string,
    image?: { data: string; mimeType: string }
  ): Promise<string> {
    // 1. Coba Google Gemini jika terkonfigurasi
    if (this.genAI) {
      try {
        this.logger.log('Mengirimkan permintaan ke Google Gemini...');
        const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
        if (image) {
          contents[0].parts.push({
            inlineData: {
              data: image.data,
              mimeType: image.mimeType,
            },
          });
        }
        const response = await this.genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
        });
        if (response.text) {
          return response.text;
        }
      } catch (geminiError) {
        this.logger.error('Google Gemini API error, mencoba fallback ke Groq...', geminiError);
      }
    } else {
      this.logger.warn('Google Gemini API key tidak dikonfigurasi, mencoba Groq...');
    }

    // 2. Coba Groq jika terkonfigurasi
    if (this.groqApiKey) {
      try {
        this.logger.log('Mengirimkan permintaan ke Groq API...');
        return await this.callGroqAPI(prompt, image);
      } catch (groqError) {
        this.logger.error('Groq API error...', groqError);
        throw new Error('Kedua provider AI (Gemini & Groq) gagal memproses permintaan.');
      }
    }

    throw new Error('Tidak ada API key AI (Gemini atau Groq) yang dikonfigurasi.');
  }

  private async callGroqAPI(
    prompt: string,
    image?: { data: string; mimeType: string }
  ): Promise<string> {
    const model = image ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    const messages: any[] = [];

    if (!image) {
      messages.push({
        role: 'user',
        content: prompt,
      });
    } else {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${image.mimeType};base64,${image.data}`,
            },
          },
        ],
      });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (status ${response.status}): ${errorText}`);
    }

    const result = await response.json() as any;
    const content = result?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq API tidak mengembalikan konten jawaban.');
    }
    return content;
  }
}
