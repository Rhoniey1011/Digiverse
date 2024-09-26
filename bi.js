const fs = require("fs");
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");
const { DateTime } = require('luxon');

const configPath = path.join(process.cwd(), "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

let wait_time = config.wait_time;

class Digiverse {
  constructor() {
    this.headers = {
      Accept: "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      "Content-Type": "application/json",
      Origin: "https://tgapp.digibuy.io",
      Referer: "https://tgapp.digibuy.io/",
      "Sec-Ch-Ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": "Ims",
    };
    this.line = "~".repeat(42).white;
  }

  async waitWithCountdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `===== Semua akun telah selesai, tunggu ${i} detik untuk melanjutkan siklus =====`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("");
  }

  log(msg) {
    const time = new Date().toLocaleString("vi-VN", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    console.log(`[${time}] ${msg}`);
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async title() {
    console.clear();
    console.log(`
                ███████╗███████╗██████╗ ███╗   ███╗ ██████╗ 
                ╚══███╔╝██╔════╝██╔══██╗████╗ ████║██╔═══██╗
                  ███╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║
                 ███╔╝  ██╔══╝  ██╔═══╝ ██║╚██╔╝██║██║   ██║
                ███████╗███████╗██║     ██║ ╚═╝ ██║╚██████╔╝
                ╚══════╝╚══════╝╚═╝     ╚═╝     ╚═╝ ╚═════╝ 
                `);
    console.log(
      colors.yellow(
        "Alat ini dibuat oleh Zepmo. Jika Anda menyukainya, silakan dukung saya dengan satu subscribe!"
      )
    );
    console.log(
      colors.blue(
        "Hubungi Telegram: https://web.telegram.org/k/#@zepmoairdrop \n"
      )
    );
  }

  parse(data) {
    const params = new URLSearchParams(data);
    const parsedData = {};
    for (const [key, value] of params.entries()) {
      parsedData[key] = value;
    }
    return parsedData;
  }

  async login(data, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/user/login";
    const payload = {
      uid: user?.id,
      first_name: user?.first_name,
      last_name: user?.last_name,
      username: user?.username,
      tg_login_params: data,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: this.headers
      });
      if (response?.data?.data?.token) {
        this.log(`[Akun ${index}] Login berhasil!`.green);
        return response.data.data.token;
      } else {
        this.log(`[Akun ${index}] Login gagal!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Login gagal: ${error.message}`.red);
    }
  }

  async getBalance(token, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/point/balance";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(`[Akun ${index}] Saldo: ${response.data.data} Digis`.green);
      } else {
        this.log(`[Akun ${index}] Gagal mengambil saldo!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Gagal mengambil saldo: ${error.message}`.red);
    }
  }

  async checkin(token, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/daily/task/checkIn";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
      type: "daily_check_in",
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(`[Akun ${index}] Checkin berhasil!`.green);
      } else {
        this.log(`[Akun ${index}] Hari ini sudah checkin!`.yellow);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Checkin gagal: ${error.message}`.red);
    }
  }

  async getTaskList(token, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/tasks/list";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        return response.data.data;
      } else {
        this.log(`[Akun ${index}] Gagal mengambil daftar tugas!`.red);
      }
    } catch (error) {
      this.log(
        `[Akun ${index}] Gagal mengambil daftar tugas: ${error.message}`.red
      );
    }
  }

  async completeTask(token, index, user, task) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/tasks/progress";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
      type: task.name,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(
          `[Akun ${index}] Menyelesaikan tugas ${task.name} berhasil!`.blue
        );
      } else {
        this.log(
          `[Akun ${index}] Menyelesaikan tugas ${task.name} gagal!`.red
        );
      }
    } catch (error) {
      this.log(
        `[Akun ${index}] Menyelesaikan tugas ${task.name} gagal: ${error.message}`
          .red
      );
    }
  }

  async claimTask(token, index, user, task) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/tasks/claim";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
      type: task.name,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(
          `[Akun ${index}] Mengklaim hadiah tugas ${task.name} berhasil!`.green
        );
      } else {
        this.log(
          `[Akun ${index}] Mengklaim hadiah tugas ${task.name} gagal!`.red
        );
      }
    } catch (error) {
      this.log(
        `[Akun ${index}] Mengklaim hadiah tugas ${task.name} gagal: ${error.message}`
          .red
      );
    }
  }

  async farming(token, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/point/reward/farming";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(`[Akun ${index}] Memulai farming berhasil!`.green);
      } else {
        if (response?.data?.err === 'Has farming event wait claim') {
            this.log(`[Akun ${index}] Sudah memulai farming sebelumnya!`.yellow);
        }
        else this.log(`[Akun ${index}] Memulai farming gagal!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Memulai farming gagal: ${error.message}`.red);
    }
  }

async rewardFarming(token, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/point/reward";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        return response.data.data.next_claim_timestamp;
      } else {
        this.log(`[Akun ${index}] Gagal mengambil informasi farming!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Gagal mengambil informasi farming: ${error.message}`.red);
    }
}

async claimFarming(token, index, user) { 
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/point/reward/claim";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const payload = {
      uid: user?.id,
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(`[Akun ${index}] Mengklaim hadiah farming berhasil | (+) ${response.data.data} Digis!`.green);
      } else {
        this.log(`[Akun ${index}] Mengklaim hadiah farming gagal!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Mengklaim hadiah farming gagal: ${error.message}`.red);
    }
}

async gameCount(token, index, user) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/game/play";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    try {
      const response = await axios.get(url, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(`[Akun ${index}] Tersisa ${response.data.data.game_count} tiket bermain game!`.green);
        return response.data.data;
      } else {
        this.log(`[Akun ${index}] Gagal mengambil informasi game!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Gagal mengambil informasi game: ${error.message}`.red);
    }
}

async claimGame(token, index, game_id) {
    const url = "https://tgapp-api.digibuy.io/api/tgapp/v1/game/claim";
    const headers = {
      ...this.headers,
      Authorization: token,
    };
    const point = Math.floor(Math.random() * (200 - 150 + 1) + 150);
    const payload = {
        game_id: game_id,
        point: point
    };
    try {
      const response = await axios.post(url, payload, {
        headers: headers
      });
      if (response?.data?.code === 200) {
        this.log(`[Akun ${index}] Selesai bermain game | (+) ${point} Digis!`.green);
      } else {
        this.log(`[Akun ${index}] Mengklaim hadiah game gagal!`.red);
      }
    } catch (error) {
      this.log(`[Akun ${index}] Mengklaim hadiah game gagal: ${error.message}`.red);
    }
}

  async process(data, index) {
    const parser = this.parse(data);
    const user = JSON.parse(decodeURIComponent(parser["user"]));
    const token = await this.login(data, index, user);
    if (token) {
      await this.getBalance(token, index, user);
      await this.checkin(token, index, user);
      if (config.is_do_task) {
        const taskList = await this.getTaskList(token, index, user);
        if (taskList) {
          for (const task of taskList["Follow Socials"]) {
            if (!task?.complete) {
              await this.completeTask(token, index, user, task);
              await this.sleep(5000);
              await this.claimTask(token, index, user, task);
            }
          }
          for (const task of taskList["Special Rewards"]) {
            if (!task?.complete) {
              await this.completeTask(token, index, user, task);
              await this.sleep(5000);
              await this.claimTask(token, index, user, task);
            }
          }
          for (const task of taskList["Weekly Rewards"]) {
            if (!task?.complete) {
              await this.completeTask(token, index, user, task);
              await this.sleep(5000);
              await this.claimTask(token, index, user, task);
            }
          }
        }
      }
      let next_claim = 0;
      const time = await this.rewardFarming(token, index, user);
      if (time) {
        next_claim = time;
      }
      if (next_claim === 0) {
        await this.farming(token, index, user);
      }
      else if (next_claim > Date.now()) {
        const format_next_claim = DateTime.fromMillis(next_claim).toFormat('yyyy-MM-dd HH:mm:ss');
        this.log(`[Akun ${index}] Sedang farming, selesai pada ${format_next_claim.grey} !`.yellow);
        wait_time = Math.min(wait_time,parseInt((next_claim - Date.now()) / 1000));
      }
        else {
            await this.claimFarming(token, index, user);
            await this.farming(token, index, user);
        }
        let gameInfo = {
            game_count: 1
        }
        while (gameInfo?.game_count > 0) {
            gameInfo = await this.gameCount(token, index, user);
            if (gameInfo?.game_count > 0) {
                this.log(`[Akun ${index}] Mulai bermain game, tunggu 30 detik untuk menyelesaikannya...`.blue);
                await this.sleep(30000);
                await this.claimGame(token, index, gameInfo?.game_id);
            }
            else {
                break;
            }
        }

    }
  }

  async main() {
    await this.title();
    const dataFile = path.join(process.cwd(), "data.txt");
    const data = fs
      .readFileSync(dataFile, "utf8")
      .replace(/\r/g, "")
      .split("\n")
      .filter(Boolean);

    if (data.length <= 0) {
      this.log("Tidak ada akun yang ditambahkan!".red);
      await this.sleep(5000);
      process.exit();
    }

    while (true) {
      const threads = [];
      wait_time = config.wait_time;
      for (const [index, tgData] of data.entries()) {
        threads.push(this.process(tgData, index + 1));
        if (threads.length >= config.threads) {
            console.log(`Menjalankan ${threads.length} proses thread...`.bgYellow);
          await Promise.all(threads);
          threads.length = 0;
        }
      }
      if (threads.length > 0) {
        console.log(`Menjalankan ${threads.length} proses thread...`.bgYellow);
        await Promise.all(threads);
      }
      await this.waitWithCountdown(wait_time);
    }
  }
}

if (require.main === module) {
  process.on("SIGINT", () => {
    process.exit();
  });
  new Digiverse().main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
