Proje Adı: CELL-VENGEANCE

Tür: 2D Evolution Platformer / Fighter

Tema: İntikam, Biyolojik Gelişim, Hayatta Kalma

---

1. Mekanik Detayları ve Gelişim Basamakları

Oyunun kalbi "Evrim" sistemi. Bunu Phaser'da bir Registry veya Global State olarak tutuyoruz.

Evrim Seviyesi,Görünüm,Kazanılan Mekanik,Kontrol Tuşu
Seviye 0 (Başlangıç),Sade bir hücre (Top),Sadece Zıplama (Üstten ezme),Space / Up Arrow
Seviye 1 (Kas dokusu),İki küçük kol eklenir,Yakın mesafe Yumruk
Seviye 2 (Kemik dokusu),Bacaklar eklenir,Hızlı Koşu ve Tekme
Seviye 3 (Gelişmiş Doku),"Kaslı, iri form",Havaya yumruk (Menzilli Rüzgar)
Seviye MAX,Parlayan Hücre / Tam Form,"Yanına ""Mini-Clone"" (Bot) gelir"

2. Oynanış Döngüsü (Game Loop)
- Öldür: Düşmanların (Kötü bakteriler veya robotik hücreler) kafasına zıpla veya yumrukla.
- Topla: Ölen düşmandan düşen parlayan "Hücre" parçalarını (Cell Points) topla.
- Evrimleş: Belirli bir sayıya (örneğin 10, 25, 50) ulaşınca ekran ortasında kısa bir efektle form değiştir.
- İlerle: Seviye sonundaki Boss kapısını aç.


. Bölüm Tasarımı (İlk Bölüm: Laboratuvar)

Jam süresince sadece 1 Bölüm yapacağımız için bu bölümü üç aşamalı düşün:

    - Aşama A (Eğitim): Sadece zıplayarak geçebileceğin engeller ve zayıf düşmanlar. Burada Kolları açmalısın.

    - Aşama B (Gelişim): Daha hızlı hareket eden düşmanlar. Burada Bacakları açıp tekme mekaniğini denemelisin.

    - Aşama C (Boss Arena): Laboratuvarın sonundaki büyük tüpün önünde Doktor ile savaşmalıyız.


4. Boss Savaşı: Dr. Malignant (Kötü Doktor)

Boss'un 3 farklı saldırı paterni olsun:

    Şırınga Atışı: Belirli aralıklarla oyuncuya zehir fırlatır (Menzilli).

    Hücre Ezme: Yukarıdan büyük bir petri kabı indirir (Kaçman gerekir).

    Zayıf An: Boss saldırı yaptıktan sonra yorulur; o an zıplayarak veya yumrukla hasar vermelisin.