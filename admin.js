const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. ฟังก์ชันเพิ่มข้อมูลการแทง
document.getElementById('bet-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const choice = document.getElementById('choice').value;
    const amount = parseFloat(document.getElementById('amount').value);

    // ตรวจสอบว่ามี User นี้ยัง ถ้ายังให้สร้างใหม่
    let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('name', username)
        .single();

    let userId;
    if (!userData) {
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ name: username }])
            .select('id')
            .single();
        if (createError) {
            alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
            return;
        }
        userId = newUser.id;
    } else {
        userId = userData.id;
    }

    // บันทึกลงตาราง bets (สถานะเริ่มต้นเป็น pending)
    const { error: betError } = await supabase
        .from('bets')
        .insert([{ user_id: userId, choice: choice, amount: amount, result: 'pending', profit: 0 }]);

    if (betError) {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } else {
        alert('บันทึกสำเร็จ!');
        document.getElementById('bet-form').reset();
    }
});

// 2. ฟังก์ชันกดออกผลรางวัลเพื่อคำนวณเงินอัตโนมัติ
async function processGame(winningChoice) {
    if (!confirm(`ยืนยันการออกผลฝั่ง "${winningChoice === 'blue' ? 'น้ำเงิน' : 'แดง'}" ใช่หรือไม่? ระบบจะคำนวณรายการที่ยังค้างอยู่ทั้งหมด`)) {
        return;
    }

    // ดึงรายการที่ยังเป็น pending อยู่ทั้งหมด
    const { data: pendingBets, error } = await supabase
        .from('bets')
        .select('*')
        .eq('result', 'pending');

    if (error || !pendingBets) {
        alert('ไม่สามารถดึงข้อมูลมาคำนวณได้');
        return;
    }

    for (let bet of pendingBets) {
        let result = 'lose';
        let profit = -bet.amount; // ถ้าแพ้ จะเสียเงินจำนวนที่ลง

        if (bet.choice === winningChoice) {
            result = 'win';
            if (bet.choice === 'blue') {
                profit = bet.amount * 1.0; // น้ำเงินได้เพิ่ม 1 เท่า
            } else if (bet.choice === 'red') {
                profit = bet.amount * 0.95; // แดงได้เพิ่ม 0.95 เท่า
            }
        }

        // อัปเดตผลลัพธ์ลงฐานข้อมูล
        await supabase
            .from('bets')
            .update({ result: result, profit: profit })
            .eq('id', bet.id);
    }

    alert('ประมวลผลและคำนวณยอดเงินให้ทุกคนเรียบร้อยแล้ว!');
}
