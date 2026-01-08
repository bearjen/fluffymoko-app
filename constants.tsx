
import { Pet, Booking, PetType, BookingStatus, DailyCareLog } from './types';

export const MOCK_PETS: Pet[] = [
  {
    id: 'p1',
    name: '大橘',
    type: PetType.CAT,
    gender: '公',
    breed: '米克斯',
    age: 4,
    chipNumber: '900138000123456',
    ownerName: '陳大文',
    ownerPhone: '0912-345-678',
    emergencyContactName: '陳太太',
    emergencyContactPhone: '0912-888-999',
    familiarHospital: '博愛動物醫院',
    medicalNotes: '無',
    dietaryNeeds: '只吃乾糧，需定時定量',
    litterType: '豆腐砂 (條狀)',
    feedingHabit: '早晚各一餐乾糧，下午偶爾給肉泥',
    allergens: '雞肉、螃蟹',
    photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'p2',
    name: '咪咪',
    type: PetType.CAT,
    gender: '母',
    breed: '布偶貓',
    age: 2,
    chipNumber: '900138000654321',
    ownerName: '林小姐',
    ownerPhone: '0922-111-222',
    emergencyContactName: '林先生',
    emergencyContactPhone: '0922-333-444',
    familiarHospital: '核心24H動物醫院',
    medicalNotes: '無',
    dietaryNeeds: '只吃特定品牌濕食',
    litterType: '礦砂 (細砂)',
    feedingHabit: '全濕食，一日四餐，少量多餐',
    allergens: '大豆、化學香精',
    photoUrl: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'p3',
    name: '豆豆',
    type: PetType.CAT,
    gender: '公',
    breed: '英國短毛貓',
    age: 1,
    chipNumber: '900138000789012',
    ownerName: '王先生',
    ownerPhone: '0933-444-555',
    emergencyContactName: '王太太',
    emergencyContactPhone: '0933-666-777',
    familiarHospital: '康和貓專科醫院',
    medicalNotes: '有輕微過敏',
    dietaryNeeds: '無穀飼料',
    litterType: '松木砂',
    feedingHabit: '任食制，碗內需隨時有乾糧',
    allergens: '無特別已知過敏源',
    photoUrl: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=200&h=200'
  }
];

const today = new Date();
const formatDate = (days: number) => {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  d.setDate(today.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    petIds: ['p1'],
    checkIn: formatDate(-2),
    checkOut: formatDate(3),
    status: BookingStatus.CHECKED_IN,
    roomNumber: '1',
    totalPrice: 4500,
    notes: '貓咪很親人，喜歡被拍屁屁'
  },
  {
    id: 'b2',
    petIds: ['p2'],
    checkIn: formatDate(0),
    checkOut: formatDate(5),
    status: BookingStatus.CHECKED_IN,
    roomNumber: 'VIP 01',
    totalPrice: 4750,
    notes: 'VIP 1 住宿中'
  }
];

export const MOCK_CARE_LOGS: DailyCareLog[] = [
  {
    id: 'l1',
    petId: 'p1',
    date: formatDate(0),
    feedingStatus: '全部吃完',
    // Fix: Changed '正常' to '漂亮成型' to match the DailyCareLog['litterStatus'] type
    litterStatus: '漂亮成型',
    // Fix: Changed '精神飽滿' to '電力滿格' to match the DailyCareLog['mentalStatus'] type
    mentalStatus: '電力滿格',
    mood: '開心',
    notes: '大橘今天胃口很好，一放飯就衝過來吃。下午有幫他梳毛，他表現得很享受，一直在咕嚕咕嚕。',
    photoUrl: 'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?auto=format&fit=crop&q=80&w=400&h=300'
  }
];
