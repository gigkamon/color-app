// ใส่ค่าที่ก๊อปปี้มาจาก Supabase Project Settings
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchBets() {
    const tableBody = document.getElementById('bet-table-body');
    tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">กำลังโหลดข้อมูล...</td></tr>';

    // ดึงข้อมูลจากตาราง bets พร้อมเชื่อมข้อมูลตาราง users
    const { data, error } = await supabase
        .from('bets')
        .select(`
            id,
            choice,
            amount,
            result,
            profit,
            users ( name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
        return;
    }

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">ยังไม่มีข้อมูลการลงเดิมพัน</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    data.forEach(bet => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';

        let badgeColor = bet.choice === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800';
        let choiceText = bet.choice === 'blue' ? 'น้ำเงิน (1x)' : 'แดง (0.95x)';
        
        let resultText = 'รอดำเนินการ';
        let resultColor = 'text-gray-500';
        if (bet.result === 'win') {
            resultText = 'ชนะ';
            resultColor = 'text-green-600 font-bold';
        } else if (bet.result === 'lose') {
            resultText = 'แพ้';
            resultColor = 'text-red-600 font-bold';
        }

        row.innerHTML = `
            <td class="p-3">${bet.users ? bet.users.name : 'ไม่ระบุชื่อ'}</td>
            <td class="p-3"><span class="px-2 py-1 rounded text-xs ${badgeColor}">${choiceText}</span></td>
            <td class="p-3">${Number(bet.amount).toLocaleString()}</td>
            <td class="p-3 ${resultColor}">${resultText}</td>
            <td class="p-3">${bet.profit ? Number(bet.profit).toLocaleString() : '-'}</td>
        `;
        tableBody.appendChild(row);
    });
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บ
fetchBets();
