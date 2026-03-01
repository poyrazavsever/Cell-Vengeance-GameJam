Proje Adı: CELL-VENGEANCE

Tür: 2D Aksiyon Platformer / Fighter

Tema: İntikam, Biyolojik Büyüme, Hayatta Kalma

---

## 1) Çekirdek Sistem: Hücre Emilimi ve Büyüme

Oyunun merkezinde artık market tabanlı evrim değil, bölüm içi **hücre emilimi ile görsel büyüme** var.

- Düşman öldüğünde hücre parçacıkları düşer.
- Oyuncu pickup'a dokunduğunda hücre anında kaybolmaz; kısa bir tween ile oyuncuya çekilir.
- Hücre oyuncuya ulaştığında puan işlenir.
- Eşikler: **12 / 28 / 52**
- Her eşik geçildiğinde:
  - `growthStage` +1 olur (0 -> 3)
  - Oyuncu görsel olarak büyür (ölçek artışı)
  - Kısa pulse/flash efekti oynar

### Büyüme Aşamaları (yalnızca görsel)
- Aşama 0: ölçek `0.48`
- Aşama 1: ölçek `0.54`
- Aşama 2: ölçek `0.60`
- Aşama 3: ölçek `0.66`

Not: Büyüme, savaş istatistiklerini doğrudan artırmaz; yalnızca görsel etki verir.

---

## 2) Bölüm Sonu Ekonomisi (Artan Hücre)

Bölüm içinde toplanan hücrelerin bir kısmı büyümede “harcanır”, kalan kısmı cüzdana aktarılır.

- `collectedCells`: Bölümde toplanan toplam hücre
- `spentForGrowth`: Geçilen büyüme eşiklerine harcanan toplam
- `residualCells`: Bölüm sonu markete taşınan artan hücre

Formül:
- `residualCells = collectedCells - spentForGrowth`

Bölüm tamamlanınca cüzdana yalnızca `residualCells` eklenir.

---

## 3) Market Sistemi (Evrim Kaldırıldı)

Marketten artık `evolution` satın alınmaz. Sadece özellik güçlendirmeleri bulunur:

- `maxHp`: Maksimum can artışı
- `attack`: Saldırı gücü artışı
- `moveSpeed`: Yatay hareket hızı artışı
- `jumpPower`: Zıplama kuvveti artışı
- `dashBoost`: Dash bonusu artışı

Önemli kural:
- Dash, artık evrimle değil **`dashBoost >= 1`** olduğunda açılır.

---

## 4) Oynanış Döngüsü (Game Loop)

1. Düşmanları stomp veya saldırı ile öldür.
2. Düşen hücreleri topla ve oyuncuya emilim animasyonuyla çek.
3. Büyüme eşiklerini geçtikçe görsel olarak büyü.
4. Bölüm sonundaki kapıya gidip `Enter` ile bölümü bitir.
5. Bölüm sonu markette artan hücreleri kalıcı güçlendirmelere harca.
6. Bir sonraki bölüme geç.

---

## 5) Bölüm Akışı

Oyun toplam 3 bölümden oluşur:

- Bölüm 1: Eğitim / giriş yoğunluğu
- Bölüm 2: Orta yoğunluk
- Bölüm 3: Final yoğunluğu

Akış:
- Başlangıçta yalnızca Bölüm 1 açıktır.
- Tamamlanan bölüm bir sonrakini açar.
- 3. bölüm sonrasında “Oyunun devamı gelecek” mesajı gösterilir ve serbest bölüm seçimi açılır.

---

## 6) Düşman Rol Dağılımı

- **Scout (Yakın dövüş / avcı):** Hızlı baskı, lunge ile alan daraltma
- **Spitter (Menzilli / topçu):** Uzak mesafeden mermi atışı ile yönlendirme
- **Brute (Ağır / tank):** Uzun dash ile hat kapatma, dash sonrası savunmasız pencere

---

## 7) Kontroller

- Hareket: `A / D` veya `Sol / Sağ`
- Zıplama: `Space` veya `W`
- Saldırı: `J`
- Dash: `Shift` (yalnızca `dashBoost` açıldıysa)
- Kapıdan geçiş: `Enter` (kapı temasında)

---

## 8) Varlık Notu

Karakter tarafında artık tek sprite sheet kullanılır:
- `public/assets/characters/1.png`

Eski çoklu evrim sprite setleri (2..5) kullanılmaz.
