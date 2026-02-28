# CELL-VENGEANCE

![CELL-VENGEANCE](public/assets/logo.png)

Phaser 3 ve Next.js üzerinde geliştirilen 2D "evolution platformer/fighter" oyunu. Tek bölümde (Laboratuvar) hücre formundan kaslı bir organizmaya evrilip Dr. Malignant'ı alt etmeyi hedefliyoruz.

## Oynanış Özeti
- Düşmanları zıplayarak veya yakın dövüşle öldür, düşen **Cell Point**'leri topla.
- Eşiklere (10 / 25 / 50) ulaşınca otomatik evrim sahnesi tetiklenir, yeni form ve hareketler açılır.
- Bölüm sonunda boss kapısı açılır; Dr. Malignant üç atak paternine sahiptir.

## Evrim Basamakları
| Seviye | Görünüm | Yeni Mekanik | Tuş | Not |
| --- | --- | --- | --- | --- |
| 0 | Basit hücre/top | Zıplama, stomp | `Space` / `↑` | Küçük hurtbox |
| 1 | Kas dokusu, kollar | Hafif yumruk | `J` | Kısa menzil |
| 2 | Kemik dokusu, bacak | Koşu/dash, tekme | `Shift` + yön / `K` | Momentum, itme |
| 3 | Gelişmiş, iri | Havaya yumruk → rüzgar dalgası | `K` | Küçük projectile |
| MAX | Parlayan form | Mini-Clone bot | Pasif | Bot yakın dövüş yapar |

## Kontroller
- **Hareket:** `A/D` veya ok tuşları
- **Zıplama / Stomp:** `Space` veya `↑`
- **Hafif Saldırı:** `J`
- **Ağır / Özel:** `K`
- **Koşu/Dash:** `Shift` (Seviye 2+)

## Bölüm Yapısı (Laboratuvar)
- **Aşama A – Eğitim:** Basit platformlar, zayıf düşman; Lv1 açılır.
- **Aşama B – Gelişim:** Hareketli platform, hızlı düşman; Lv2 açılır.
- **Aşama C – Boss Arena:** Dr. Malignant savaş alanı; kapı kapalıyken arena kilitlenir.

## Boss: Dr. Malignant
- **Şırınga Atışı:** Zehirli projectile, yavaşlatma/DOT.
- **Hücre Ezme:** Tavandan petri kabı düşer; gölge ile telegraph.
- **Zayıf An:** Her pattern sonrası 1–2 sn boyunca hasar alabilir; sağlık azaldıkça hızlanır.

## Kurulum ve Çalıştırma
1) Bağımlılıkları kur: `npm install`
2) Geliştirme sunucusu: `npm run dev` (localhost:8080)
3) Production build: `npm run build` → `dist/`
4) Telemetri istemiyorsan `dev-nolog` / `build-nolog` kullan veya `log.js` çağrılarını kaldır.

## Dizin Yapisi
```text
src/
  game/
    config/
      gameConfig.ts
    constants/
      assetKeys.ts
      eventKeys.ts
      sceneKeys.ts
    data/
      evolutionData.ts
    entities/
      player/
        Player.ts
    scenes/
      BootScene.ts
      PreloadScene.ts
      GameScene.ts
      HudScene.ts
      index.ts
    state/
      GameState.ts
    EventBus.ts
    main.ts
  pages/
    index.tsx
  App.tsx
  PhaserGame.tsx

public/
  assets/
    logo.png
    characters/
      1.png
      2.png
      3.png
      4.png
      5.png
```

- `BootScene` oyun state'ini sifirlar ve preload'a gecer.
- `PreloadScene` butun assetleri yukler (logo + `characters/1..5.png`).
- `GameScene` temel platform, oyuncu ve Cell Point toplama dongusunu calistirir.
- `HudScene` puan ve evrim seviyesini EventBus uzerinden gunceller.

## Teknolojiler
- Phaser 3.90.0
- Next.js 15
- TypeScript 5
- React 19

## Lisans
MIT (orijinal template lisansı).
