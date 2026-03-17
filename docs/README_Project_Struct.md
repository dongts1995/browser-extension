
``
slides-extension/
│
├── docker-compose.yml                  (Chạy container dev.)
├── Dockerfile                          (Định nghĩa môi trường Node.)
├── .dockerignore                       (Bỏ node_modules, dist khỏi image.)
│
├── package.json                        (Khai báo dependency, script, định nghĩa type)
├── package-lock.json                   (File này tự động sinh ra.)
├── tsconfig.json                       (Cấu hình typescript)
├── vite.config.ts                      (Cấu hình build tool)
│
├── public/                             (Chứa file không cần build)
│   └── manifest.json
│
├── src/
│   ├── background/                     (web,auth...)
│   │   └── background.ts
│   │
│   ├── content/                        (Slide, emotion, control slide...)
│   │   └── contentScript.ts
│   │
│   ├── popup/                          (UI)
│   │   ├── popup.html
│   │   └── popup.ts
│   │
│   ├── services/                       (Sau này sẽ có: websocket.ts, auth.ts, storage.ts.. Giúp code clean và scale được.)
│   │   └── (để sau này: websocket.ts, auth.ts...)
│   │
│   ├── types/                          (Custom TypeScript type cho message, chi tiết ở dưới)
│   │   └── chrome.d.ts
│   │
│   └── utils/
│       └── logger.ts
│
└── dist/   (Docker hoặc vite build tạo ra. Chrome sẽ load thư mục này.)
```

📌 Giải thích từng phần
🔹 types/

Custom TypeScript type cho message:

Ví dụ:

export type ExtensionMessage =
  | { type: "PING" }
  | { type: "NEXT_SLIDE" }
  | { type: "EMOTION"; payload: string };


