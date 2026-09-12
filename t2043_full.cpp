// NOI 2020 "Tears" / โศกนาฏกรรม  (programming.in.th 2043, Luogu P6774)
// full constraints: N <= 1e5, M <= 2e5
//
// นับคู่ (i, j) ที่ i < j, P_i < P_j, ดัชนีทั้งคู่อยู่ใน [r1,r2], ค่าทั้งคู่อยู่ใน [c1,c2]
//
// ข้อสังเกตที่ใช้ตลอดไฟล์: คู่ที่นับมี i < j และ P_i < P_j อยู่แล้ว ขอบสี่ด้านจึงผูกปลายละข้าง
//     ดัชนีอยู่ใน [r1,r2] ทั้งคู่  <=>  i >= r1 และ j <= r2
//     ค่าอยู่ใน [c1,c2] ทั้งคู่    <=>  P_i >= c1 และ P_j <= c2
//
// หั่นแกนดัชนีเป็นบล็อกขนาด B แล้วแตกคำถามเป็นหกหมวดตามที่ปลายสองข้างตกอยู่
//   ซ้ายเศษ x ซ้ายเศษ, ขวาเศษ x ขวาเศษ, ซ้ายเศษ x ขวาเศษ   -> รวมเป็นรอบเดียว O(B log B)
//   ซ้ายเศษ x บล็อกเต็ม, บล็อกเต็ม x ขวาเศษ                 -> O(1) ต่อชิ้น ด้วยตาราง F
//   บล็อกเต็มบล็อกเดียวกัน                                    -> O(1) ต่อบล็อก ด้วยตาราง f ของบล็อกนั้น
//   บล็อกเต็มคนละบล็อก                                        -> กวาดค่า + ตาราง E (ดูด้านล่าง)
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

// อ่านอินพุตทั้งไฟล์ทีเดียวแล้วแกะเอง อินพุตเต็มขอบเขตมีตัวเลขราวเก้าแสนตัว
static char *inBuf; static size_t inPos, inLen;
static void readAll() {
    size_t cap = 1 << 22; inBuf = (char *)malloc(cap); inLen = 0;
    while (true) {
        if (inLen + (1 << 20) > cap) { cap <<= 1; inBuf = (char *)realloc(inBuf, cap); }
        size_t got = fread(inBuf + inLen, 1, 1 << 20, stdin);
        inLen += got;
        if (got < (1 << 20)) break;
    }
    inPos = 0;
}
static inline int readInt() {
    while (inPos < inLen && (inBuf[inPos] < '0' || inBuf[inPos] > '9')) inPos++;
    int x = 0;
    while (inPos < inLen && inBuf[inPos] >= '0' && inBuf[inPos] <= '9') x = x * 10 + (inBuf[inPos++] - '0');
    return x;
}

static int n, m, B, nb;
static vector<int> P, posOf;          // posOf[v] = ตำแหน่งของค่า v
static vector<int> blkOf, blkL, blkR;

// F[v][b] = จำนวนตำแหน่งในบล็อก 0..b-1 ที่มีค่า <= v   (b = 0..nb)
// เก็บโดยให้ "ค่า" เป็นแถว เพราะลูปร้อนทุกอันวิ่งตาม b โดยตรึง v ไว้
// เวอร์ชันแรกเก็บสลับกัน ทำให้ทุกการอ่านห่างกัน 400KB และพลาดแคชทุกครั้ง
static vector<int> F;                 // ขนาด (n+1) * (nb+1)
static int NBP1;
static inline int Fat(int b, int v) { return F[(size_t)v * NBP1 + b]; }
// จำนวนตำแหน่งในบล็อก [bl, br] ที่มีค่าอยู่ใน [lo, hi]
static inline int cntBlocks(int bl, int br, int lo, int hi) {
    if (bl > br || lo > hi) return 0;
    if (lo < 1) lo = 1;
    if (hi > n) hi = n;
    if (lo > hi) return 0;
    return (Fat(br + 1, hi) - Fat(bl, hi)) - (Fat(br + 1, lo - 1) - Fat(bl, lo - 1));
}

// ---- ต่อบล็อก: ค่าที่เรียงแล้ว, อันดับภายในบล็อก, และตาราง f ----
static vector<vector<int>> blkSortedPos;   // ตำแหน่งในบล็อก เรียงตามค่า
static vector<int> rankIn;                 // rankIn[pos] = อันดับของค่าที่ pos ภายในบล็อกของมัน (1-based)
static vector<vector<int>> fTab;           // fTab[b] = ตาราง (sz+1)^2 แบบผลรวมสะสมสองมิติ

// f[u][v] = จำนวนคู่ i<j ในบล็อกนี้ ที่ rank_i <= u, rank_j <= v และ rank_i < rank_j
// ผู้เรียกส่งอันดับมาให้เลย (คำนวณจากตาราง F ได้ในเวลาคงที่) จึงไม่ต้อง binary search
// เวอร์ชันแรกใช้ lower_bound/upper_bound ต่อบล็อกต่อคำถาม ซึ่งทำให้เคสช่วงยาวใช้เวลา 14.75 วินาที
static inline ll withinBlockRank(int b, int lo, int hi) {
    if (lo > hi) return 0;
    int W = blkR[b] - blkL[b] + 2;
    const int *f = fTab[b].data();
    // เก็บแบบ f[v][u] (แถวคือ v) การอ่านสองครั้งจึงอยู่แถวเดียวกัน ลด cache miss ครึ่งหนึ่ง
    const int *row = f + (size_t)hi * W;
    // #{rank_i >= lo, rank_j <= hi}  (rank_i < rank_j อยู่ในนิยามของ f แล้ว)
    return (ll)row[hi] - (ll)row[lo - 1];
}

int main() {
    // ---------- อ่านอินพุต ----------
    readAll();
    n = readInt(); m = readInt();
    P.assign(n + 2, 0); posOf.assign(n + 2, 0);
    for (int i = 1; i <= n; i++) { P[i] = readInt(); posOf[P[i]] = i; }

    // จูนแล้วที่ n = 1e5: B ราว 120 เร็วที่สุด (บล็อกเล็กลงทำให้ตาราง f ของแต่ละบล็อกอยู่ในแคชได้)
    B = max(1, (int)(sqrt((double)n) * 0.38));
    if (const char *e = getenv("BLK")) { int v = atoi(e); if (v > 0) B = v; }  // ใช้ตอนจูนเท่านั้น
    nb = (n + B - 1) / B;
    blkOf.assign(n + 2, 0); blkL.assign(nb, 0); blkR.assign(nb, 0);
    for (int i = 1; i <= n; i++) blkOf[i] = (i - 1) / B;
    for (int b = 0; b < nb; b++) { blkL[b] = b * B + 1; blkR[b] = min(n, (b + 1) * B); }

    // ---------- ตาราง F ----------
    NBP1 = nb + 1;
    F.assign((size_t)(n + 1) * NBP1, 0);
    for (int v = 1; v <= n; v++) {
        int *cur = &F[(size_t)v * NBP1];
        const int *prv = &F[(size_t)(v - 1) * NBP1];
        int bv = blkOf[posOf[v]];
        for (int b = 0; b <= bv; b++) cur[b] = prv[b];
        for (int b = bv + 1; b <= nb; b++) cur[b] = prv[b] + 1;
    }

    // ---------- ต่อบล็อก: เรียงค่า, อันดับ, ตาราง f ----------
    blkSortedPos.assign(nb, {});
    rankIn.assign(n + 2, 0);
    fTab.assign(nb, {});
    for (int b = 0; b < nb; b++) {
        int sz = blkR[b] - blkL[b] + 1;
        vector<int> ps(sz);
        for (int k = 0; k < sz; k++) ps[k] = blkL[b] + k;
        sort(ps.begin(), ps.end(), [&](int x, int y) { return P[x] < P[y]; });
        blkSortedPos[b] = ps;
        for (int k = 0; k < sz; k++) rankIn[ps[k]] = k + 1;

        int W = sz + 1;
        vector<int> f((size_t)W * W, 0);
        // ใส่ 1 ที่ (rank_i, rank_j) ของทุกคู่ที่ i < j และ rank_i < rank_j
        for (int i = blkL[b]; i <= blkR[b]; i++)
            for (int j = i + 1; j <= blkR[b]; j++)
                if (rankIn[i] < rankIn[j]) f[(size_t)rankIn[j] * W + rankIn[i]]++;
        // ผลรวมสะสมสองมิติบน layout f[v][u]
        for (int v = 1; v < W; v++)
            for (int u = 1; u < W; u++)
                f[(size_t)v * W + u] += f[(size_t)(v - 1) * W + u] + f[(size_t)v * W + u - 1]
                                      - f[(size_t)(v - 1) * W + u - 1];
        fTab[b] = move(f);
    }

    // ---------- อ่านคำถาม ----------
    vector<int> qr1(m), qr2(m), qc1(m), qc2(m);
    vector<ll> ans(m, 0);
    for (int k = 0; k < m; k++) { qr1[k] = readInt(); qr2[k] = readInt(); qc1[k] = readInt(); qc2[k] = readInt(); }

    // ---------- หมวด "บล็อกเต็มคนละบล็อก": กวาดค่าจากน้อยไปมาก ----------
    // colTotal[bx] = จำนวนคู่ที่ปลายบนอยู่บล็อก bx และปลายล่างอยู่บล็อกใดก็ได้ที่เล็กกว่า bx
    // E[bx][b1]   = จำนวนคู่ที่ปลายบนอยู่บล็อก bx และปลายล่างอยู่บล็อกที่เล็กกว่า b1
    // ทั้งสองนับเฉพาะของที่ใส่ไปแล้ว (ค่า <= เวลาปัจจุบัน) และ P_i < P_j รับประกันโดยลำดับการใส่
    vector<ll> colTotal(nb, 0);
    vector<ll> E((size_t)nb * nb, 0);
    vector<int> c(nb, 0);
    // เหตุการณ์: คำถาม k ต้องอ่านค่าที่เวลา c2 (บวก) และที่เวลา c1-1 (ลบ)
    vector<vector<pair<int,int>>> evAt(n + 2);   // evAt[t] = (k, sign)
    for (int k = 0; k < m; k++) {
        int b1 = blkOf[qr1[k]], b2 = blkOf[qr2[k]];
        if (b2 - b1 < 2) continue;               // ไม่มีบล็อกเต็มสองบล็อกขึ้นไป
        evAt[qc2[k]].push_back({k, +1});
        if (qc1[k] - 1 >= 1) evAt[qc1[k] - 1].push_back({k, -1});
    }
    for (int t = 1; t <= n; t++) {
        int pos = posOf[t], bx = blkOf[pos];
        // อัปเดตก่อนนับตัวเอง: คู่ใหม่เกิดกับของที่ใส่ไปแล้วเท่านั้น
        ll run = 0, pref = 0;
        ll *Ebase = &E[bx];
        for (int b1 = 0; b1 < nb; b1++) {
            if (b1 == bx) pref = run;      // run ตอนนี้คือผลรวมของบล็อกที่ < bx พอดี ไม่ต้องวนซ้ำ
            Ebase[(size_t)b1 * nb] += run;
            run += c[b1];
        }
        colTotal[bx] += pref;
        c[bx]++;

        for (auto &ev : evAt[t]) {
            int k = ev.first, sg = ev.second;
            int bb1 = blkOf[qr1[k]] + 1, bb2 = blkOf[qr2[k]] - 1;
            ll s = 0;
            const ll *Erow = &E[(size_t)bb1 * nb];   // ติดกันในหน่วยความจำ
            for (int bx2 = bb1; bx2 <= bb2; bx2++) s += colTotal[bx2] - Erow[bx2];
            ans[k] += sg * s;
        }
    }

    // ---------- ประกอบคำตอบของแต่ละคำถาม ----------
    // BIT เล็กสำหรับหมวดเศษ (ดัชนีอัดเป็น 0..cntPart-1)
    vector<int> bitArr;
    auto bitInit = [&](int sz) { bitArr.assign(sz + 1, 0); };
    auto bitAdd  = [&](int i)  { for (++i; i < (int)bitArr.size(); i += i & -i) bitArr[i]++; };
    auto bitSum  = [&](int i)  { int s = 0; for (++i; i > 0; i -= i & -i) s += bitArr[i]; return s; };

    vector<int> partPos;    // ตำแหน่งของชิ้นเศษ เรียงตามค่า
    vector<int> idxOfPos;   // ตำแหน่ง -> ลำดับที่ (ตามตำแหน่ง) ในกองเศษ
    idxOfPos.assign(n + 2, -1);

    for (int k = 0; k < m; k++) {
        int r1 = qr1[k], r2 = qr2[k], c1 = qc1[k], c2 = qc2[k];
        if (c1 > c2 || r1 > r2) { ans[k] = 0; continue; }
        int b1 = blkOf[r1], b2 = blkOf[r2];
        ll res = ans[k];   // ส่วนที่ได้จากการกวาดแล้ว (หมวดบล็อกเต็มคนละบล็อก)

        if (b1 == b2) {
            // ทั้งคำถามอยู่ในบล็อกเดียว: นับตรง ๆ ด้วย BIT บนอันดับภายในบล็อก
            res = 0;
            int sz = blkR[b1] - blkL[b1] + 1;
            bitInit(sz + 1);
            for (int i = r1; i <= r2; i++) {
                int v = P[i];
                if (v < c1 || v > c2) continue;
                res += bitSum(rankIn[i] - 1);
                bitAdd(rankIn[i]);
            }
            ans[k] = res;
            continue;
        }

        int bb1 = b1 + 1, bb2 = b2 - 1;          // ช่วงบล็อกเต็ม (อาจว่าง)
        bool hasFull = bb1 <= bb2;
        int L = hasFull ? blkL[bb1] : 0, R = hasFull ? blkR[bb2] : -1;

        // (ก)+(ข) รอบเดียวเหนือบล็อกเต็ม อ่านตาราง F สี่ครั้งต่อบล็อก
        //   lo_b = จำนวนค่าในบล็อก b ที่ <= c1-1   (ใช้เป็นขอบล่างของอันดับ และเป็นขนาดของ A)
        //   hi_b = จำนวนค่าในบล็อก b ที่ <= c2     (ใช้เป็นขอบบนของอันดับ)
        // (ก) คู่ที่อยู่ในบล็อกเต็มบล็อกเดียวกัน
        // (ข) แก้แถบค่าของหมวดบล็อกเต็มคนละบล็อก: ลบส่วน Cross(A, S) ออก
        //     A = ค่า <= c1-1, S = ค่าใน [c1,c2]; ค่าใน A น้อยกว่าใน S ทุกตัว ปลายล่างจึงเป็นฝั่ง A เสมอ
        if (hasFull) {
            int lowCap = c1 - 1;
            const int *rowLo = lowCap >= 1 ? &F[(size_t)lowCap * NBP1] : nullptr;
            const int *rowHi = &F[(size_t)c2 * NBP1];
            ll runA = 0, cross = 0;
            for (int b = bb1; b <= bb2; b++) {
                int lo = rowLo ? rowLo[b + 1] - rowLo[b] : 0;
                int hi = rowHi[b + 1] - rowHi[b];
                res += withinBlockRank(b, lo + 1, hi);
                if (lowCap >= 1) { cross += (ll)(hi - lo) * runA; runA += lo; }
            }
            res -= cross;
        }

        // รวบรวมชิ้นเศษสองฝั่ง โดยดึงออกมาเรียงตามค่าอยู่แล้ว (ไม่ต้อง sort)
        partPos.clear();
        {
            // ซ้ายเศษ = ตำแหน่ง r1..blkR[b1] ; ขวาเศษ = blkL[b2]..r2
            const vector<int> &sl = blkSortedPos[b1];
            const vector<int> &sr = blkSortedPos[b2];
            size_t a = 0, b = 0;
            while (a < sl.size() || b < sr.size()) {
                while (a < sl.size() && (sl[a] < r1 || P[sl[a]] < c1 || P[sl[a]] > c2)) a++;
                while (b < sr.size() && (sr[b] > r2 || P[sr[b]] < c1 || P[sr[b]] > c2)) b++;
                if (a >= sl.size() && b >= sr.size()) break;
                if (b >= sr.size() || (a < sl.size() && P[sl[a]] < P[sr[b]])) partPos.push_back(sl[a++]);
                else partPos.push_back(sr[b++]);
            }
        }
        int cntPart = (int)partPos.size();
        // ลำดับตามตำแหน่ง: ซ้ายเศษมาก่อนขวาเศษเสมอ จึงจัดลำดับด้วยตำแหน่งจริงได้เลย
        {
            vector<int> byPos = partPos;
            sort(byPos.begin(), byPos.end());
            for (int t = 0; t < cntPart; t++) idxOfPos[byPos[t]] = t;
        }
        // (ค) คู่ที่ปลายทั้งสองเป็นชิ้นเศษ (ซ้ายxซ้าย, ขวาxขวา, ซ้ายxขวา) รวบเป็นรอบเดียว
        bitInit(cntPart + 1);
        for (int t = 0; t < cntPart; t++) {
            int id = idxOfPos[partPos[t]];
            res += bitSum(id - 1);      // ของที่ค่าน้อยกว่า และตำแหน่งอยู่ก่อนหน้า
            bitAdd(id);
        }
        // (ง) ชิ้นเศษ x บล็อกเต็ม
        if (hasFull) {
            for (int pos : partPos) {
                int v = P[pos];
                if (pos <= blkR[b1]) res += cntBlocks(bb1, bb2, v + 1, c2);   // เศษซ้ายเป็นปลายล่าง
                else                 res += cntBlocks(bb1, bb2, c1, v - 1);   // เศษขวาเป็นปลายบน
            }
        }
        for (int pos : partPos) idxOfPos[pos] = -1;
        ans[k] = res;
        (void)L; (void)R;
    }

    for (int k = 0; k < m; k++) printf("%lld\n", ans[k]);
    return 0;
}
