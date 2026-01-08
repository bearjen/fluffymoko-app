
export enum PetType {
  CAT = '貓',
  OTHER = '其他'
}

export enum BookingStatus {
  PENDING = '待處理',
  CONFIRMED = '安排入住',
  CHECKED_IN = '已入住',
  CHECKED_OUT = '已退房',
  CANCELLED = '已取消'
}

export enum RoomStatus {
  VACANT = '空房',
  OCCUPIED = '入住中',
  MAINTENANCE = '清潔維護',
  COMBINED = '已合併'
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  isLarge: boolean;
  combinedWith?: string;
  floor: 'upper' | 'lower';
  column: number;
  tags: string[];
}

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  gender: '公' | '母' | '未知';
  breed: string;
  age: number;
  chipNumber: string;
  ownerName: string;
  ownerPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  familiarHospital: string;
  medicalNotes: string;
  dietaryNeeds: string;
  photoUrl: string;
  litterType: string;
  feedingHabit: string;
  allergens: string;
}

export interface PreCheckRecord {
  bookingId: string;
  petId: string; 
  date: string;
  weight: number;
  temperature?: string;
  mentalStatus: '活力' | '平靜' | '緊張' | '恐懼';
  skinStatus: '健康' | '紅腫' | '有傷口' | '有寄生蟲';
  earStatus: '乾淨' | '異味' | '發炎' | '耳垢多';
  eyeNoseStatus: '正常' | '分泌物多' | '打噴嚏';
  teethStatus: '健康' | '牙結石' | '牙齦紅腫' | '有異味';
  limbStatus: '正常' | '指甲過長' | '肉球異常' | '行走異常';
  belongings: string;
  staffNotes: string;
  aiSummary?: string;
}

export interface DailyCareLog {
  id: string;
  petId: string;
  date: string;
  feedingStatus: '全部吃完' | '剩下一點' | '沒啥胃口' | '未進食';
  litterStatus: '漂亮成型' | '有點軟便' | '拉肚子了' | '還沒便便';
  mentalStatus: '電力滿格' | '穩重安靜' | '懶懶的' | '顯得緊張';
  mood: string;
  notes: string;
  photoUrl?: string;
}

export interface Booking {
  id: string;
  petIds: string[]; 
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  roomNumber: string;
  totalPrice: number;
  notes: string;
}
