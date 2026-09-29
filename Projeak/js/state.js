// State Management with LocalStorage persistence for Dried Herb Community Enterprise
import { generateRandomCoordinates } from './helpers.js';

const STORAGE_KEYS = {
  ENTERPRISE: 'herb_enterprise_profile',
  MEMBERS: 'herb_enterprise_members',
  PLOTS: 'herb_enterprise_plots',
  CROPS: 'herb_enterprise_crops',
  INVENTORY: 'herb_enterprise_inventory',
  SALES: 'herb_enterprise_sales',
  CUSTOMERS: 'herb_enterprise_customers',
  AUTH: 'herb_enterprise_auth',
  ROADMAPS: 'herb_enterprise_roadmaps',
  DRYING_BATCHES: 'herb_enterprise_drying_batches',
  PACKAGING_BATCHES: 'herb_enterprise_packaging_batches',
  PRODUCTS: 'herb_enterprise_products'
};

const MOCK_DRYING_BATCHES = [
  {
    id: 'DRY-6901',
    herbType: 'เก๊กฮวย',
    totalFreshAvailableKg: 150.0,
    freshWeightKg: 150.0,
    dryWeightKg: 15.0,
    ratioActual: '10.00',
    processedDate: '2026-06-07',
    note: 'อบแห้งเตาพลังงานแสงอาทิตย์ ตู้อบ 1 (อัตราส่วนมาตรฐาน 10:1 สด 150 kg ได้แห้ง 15 kg)',
    cropIds: ['2568/P - 001/1']
  },
  {
    id: 'DRY-6902',
    herbType: 'คาโมมายล์',
    totalFreshAvailableKg: 100.0,
    freshWeightKg: 100.0,
    dryWeightKg: 10.0,
    ratioActual: '10.00',
    processedDate: '2026-06-20',
    note: 'อบแห้งเตาลมร้อน ตู้อบ 2 (อัตราส่วนมาตรฐาน 10:1 สด 100 kg ได้แห้ง 10 kg)',
    cropIds: ['2568/P - 002/1']
  }
];

const MOCK_PACKAGING_BATCHES = [
  {
    id: 'PACK-6901',
    herbType: 'เก๊กฮวย',
    dryUsedKg: 5.00,
    packageSize: '50 G',
    jarsProduced: 100,
    processedDate: '2026-07-01',
    productId: 'PRD-003',
    productName: 'เก๊กฮวยกระป๋อง (50 G)',
    operatorName: 'นายสมเกียรติ พึ่งตน',
    note: 'บรรจุกระป๋องมาตรฐาน 50 G (150 บาท/กป.)'
  },
  {
    id: 'PACK-6902',
    herbType: 'คาโมมายล์',
    dryUsedKg: 2.50,
    packageSize: '50 G',
    jarsProduced: 50,
    processedDate: '2026-07-01',
    productId: 'PRD-004',
    productName: 'คาโมมายล์กระป๋อง (50 G)',
    operatorName: 'นางใจดี ศรีสมุนไพร',
    note: 'บรรจุกระป๋องมาตรฐาน 50 G (100 บาท/กป.)'
  }
];

let supabaseClient = null;

// Mock User Accounts for Login & Roles
const MOCK_USERS = [
  {
    username: '12/4',
    password: '0812345600',
    name: 'นายสมเกียรติ พึ่งตน',
    role: 'Admin',
    roleDisplay: 'ประธานกลุ่ม',
    memberId: 'MEM-001',
    avatarText: 'ส',
    color: 'emerald'
  },
  {
    username: '45/1',
    password: '0812345699',
    name: 'นายมานะ รักเกษตร',
    role: 'Officer',
    roleDisplay: 'เหรัญญิก',
    memberId: 'MEM-003',
    avatarText: 'ม',
    color: 'amber'
  },
  {
    username: '12/5',
    password: '0812345602',
    name: 'นางใจดี ศรีสมุนไพร',
    role: 'Member',
    roleDisplay: 'สมาชิกเกษตรกร',
    memberId: 'MEM-002',
    avatarText: 'จ',
    color: 'blue'
  }
];

// Initial Profile setup
const DEFAULT_ENTERPRISE = {
  name: 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านศรีดอนมูล',
  village: 'หมู่ที่ 2 บ้านศรีดอนมูล',
  subdistrict: 'ศรีดอนมูล',
  district: 'เชียงแสน',
  province: 'เชียงราย',
  zipcode: '57150',
  phone: '089-555-1234',
  email: 'sridonmun.driedherbs@gmail.com',
  chairman: 'นายสมเกียรติ พึ่งตน',
  description: 'กลุ่มเกษตรกรผลิตและแปรรูปสมุนไพรอบแห้งปลอดสารพิษเพื่อความยั่งยืน เก๊กฮวย คาโมมายล์ และสมุนไพรพื้นบ้าน'
};

// Mock 33 Members
const MOCK_MEMBERS = [
  { id: 'MEM-001', name: 'นายสมเกียรติ พึ่งตน', role: 'ประธานกลุ่ม', phone: '081-234-5600', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-10', houseNumber: '12/4' },
  { id: 'MEM-002', name: 'นางใจดี ศรีสมุนไพร', role: 'รองประธาน', phone: '081-234-5602', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-15', houseNumber: '12/5' },
  { id: 'MEM-003', name: 'นายมานะ รักเกษตร', role: 'เหรัญญิก', phone: '081-234-5699', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-01-15', houseNumber: '45/1' },
  { id: 'MEM-004', name: 'นางสมศรี มีวิถี', role: 'เลขานุการ', phone: '081-234-5604', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-01-20', houseNumber: '18' },
  { id: 'MEM-005', name: 'นายวิชัย ปัญญาดี', role: 'กรรมการ', phone: '081-234-5605', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-02-01', houseNumber: '99/2' },
  { id: 'MEM-006', name: 'นางนภา สุขสบาย', role: 'สมาชิกทั่วไป', phone: '081-234-5606', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-05', houseNumber: '24/1' },
  { id: 'MEM-007', name: 'นายดำรง รักชาติ', role: 'สมาชิกทั่วไป', phone: '081-234-5607', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-02-10', houseNumber: '55' },
  { id: 'MEM-008', name: 'นางสมปอง สุขสำราญ', role: 'สมาชิกทั่วไป', phone: '081-234-5608', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-10', houseNumber: '102' },
  { id: 'MEM-009', name: 'นายบุญมี ทองคำ', role: 'สมาชิกทั่วไป', phone: '081-234-5609', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-02-12', houseNumber: '7/3' },
  { id: 'MEM-010', name: 'นางประกาย แสงทอง', role: 'สมาชิกทั่วไป', phone: '081-234-5610', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-02-15', houseNumber: '88' },
  { id: 'MEM-011', name: 'นายสุรพล เด่นดี', role: 'สมาชิกทั่วไป', phone: '081-234-5611', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-20', houseNumber: '14/2' },
  { id: 'MEM-012', name: 'นางวิมล รุ่งเรือง', role: 'สมาชิกทั่วไป', phone: '081-234-5612', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-02-22', houseNumber: '33' },
  { id: 'MEM-013', name: 'นายเกรียงไกร ใฝ่ดี', role: 'สมาชิกทั่วไป', phone: '081-234-5613', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-01', houseNumber: '61/4' },
  { id: 'MEM-014', name: 'นางนงนุช สุดสวย', role: 'สมาชิกทั่วไป', phone: '081-234-5614', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-03-05', houseNumber: '40' },
  { id: 'MEM-015', name: 'นายทวีลาภ ลาภดี', role: 'สมาชิกทั่วไป', phone: '081-234-5615', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-10', houseNumber: '115' },
  { id: 'MEM-016', name: 'นางพิศมัย ใจธรรม', role: 'สมาชิกทั่วไป', phone: '081-234-5616', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-12', houseNumber: '29' },
  { id: 'MEM-017', name: 'นายอดุลย์ อบอุ่น', role: 'สมาชิกทั่วไป', phone: '081-234-5617', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-15', houseNumber: '82/1' },
  { id: 'MEM-018', name: 'นางสาวสุดา ชาเขียว', role: 'สมาชิกทั่วไป', phone: '081-234-5618', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-03-18', houseNumber: '19' },
  { id: 'MEM-019', name: 'นายสมหมาย มั่นคง', role: 'สมาชิกทั่วไป', phone: '081-234-5619', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-03-20', houseNumber: '104' },
  { id: 'MEM-020', name: 'นางอรอนงค์ โฉมงาม', role: 'สมาชิกทั่วไป', phone: '081-234-5620', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-03-22', houseNumber: '73/2' },
  { id: 'MEM-021', name: 'นายประจักษ์ รักสงบ', role: 'สมาชิกทั่วไป', phone: '081-234-5621', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-03-25', houseNumber: '51' },
  { id: 'MEM-022', name: 'นางสาวรุ่งทิวา แสงดาว', role: 'สมาชิกทั่วไป', phone: '081-234-5622', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-01', houseNumber: '95' },
  { id: 'MEM-023', name: 'นายประเสริฐ ดีเลิศ', role: 'สมาชิกทั่วไป', phone: '081-234-5623', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-04-05', houseNumber: '37/1' },
  { id: 'MEM-024', name: 'นางสาวกมลวรรณ ชื่นใจ', role: 'สมาชิกทั่วไป', phone: '081-234-5624', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-04-10', houseNumber: '6/2' },
  { id: 'MEM-025', name: 'นายพิชัย ชูชาติ', role: 'สมาชิกทั่วไป', phone: '081-234-5625', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-12', houseNumber: '128' },
  { id: 'MEM-026', name: 'นางชลลดา ปันแก้ว', role: 'สมาชิกทั่วไป', phone: '081-234-5626', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-04-15', houseNumber: '84' },
  { id: 'MEM-027', name: 'นายธวัชชัย ยอดดี', role: 'สมาชิกทั่วไป', phone: '081-234-5627', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-20', houseNumber: '111/3' },
  { id: 'MEM-028', name: 'นางมธุรส หอมกลิ่น', role: 'สมาชิกทั่วไป', phone: '081-234-5628', status: 'active', villageNumber: 'หมู่ 3', joinDate: '2024-04-22', houseNumber: '48' },
  { id: 'MEM-029', name: 'นายเสนาะ ร้องเพราะ', role: 'สมาชิกทั่วไป', phone: '081-234-5629', status: 'inactive', villageNumber: 'หมู่ 2', joinDate: '2024-04-25', houseNumber: '15/1' },
  { id: 'MEM-030', name: 'นางอัญชลี รื่นรมย์', role: 'สมาชิกทั่วไป', phone: '081-234-5630', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-04-28', houseNumber: '67' },
  { id: 'MEM-031', name: 'นายอุดม ศรีทอง', role: 'สมาชิกทั่วไป', phone: '081-234-5631', status: 'active', villageNumber: 'หมู่ 1', joinDate: '2024-05-01', houseNumber: '2/1' },
  { id: 'MEM-032', name: 'นางรักษ์ชนก อุดมดี', role: 'สมาชิกทั่วไป', phone: '081-234-5632', status: 'active', villageNumber: 'หมู่ 4', joinDate: '2024-05-05', houseNumber: '93' },
  { id: 'MEM-033', name: 'นายพชรพล อิ่มเอม', role: 'สมาชิกทั่วไป', phone: '081-234-5633', status: 'active', villageNumber: 'หมู่ 2', joinDate: '2024-05-10', houseNumber: '58/2' }
];

// Mock plots for members (Total 14 plots)
const MOCK_PLOTS = [
  { id: 'P - 001', memberIds: ['MEM-001'], name: 'แปลงสวนหน้าบ้าน (ประธาน)', sizeRai: 2, sizeNgan: 1, sizeSqWah: 50, lat: 18.9142, lng: 98.9442, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 002', memberIds: ['MEM-002'], name: 'แปลงริมคลองส่งน้ำ', sizeRai: 1, sizeNgan: 2, sizeSqWah: 0, lat: 18.9158, lng: 98.9415, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 003', memberIds: ['MEM-003'], name: 'แปลงเชิงเขาม่อนแก้ว', sizeRai: 3, sizeNgan: 0, sizeSqWah: 80, lat: 18.9121, lng: 98.9495, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 004', memberIds: ['MEM-004'], name: 'แปลงใกล้หอประชุม', sizeRai: 0, sizeNgan: 3, sizeSqWah: 50, lat: 18.9172, lng: 98.9455, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 005', memberIds: ['MEM-005'], name: 'แปลงทุ่งรวงทอง', sizeRai: 2, sizeNgan: 0, sizeSqWah: 0, lat: 18.9135, lng: 98.9428, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 006', memberIds: ['MEM-006'], name: 'แปลงสวนดอนแก้ว', sizeRai: 1, sizeNgan: 3, sizeSqWah: 40, lat: 18.9162, lng: 98.9472, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 007', memberIds: ['MEM-007'], name: 'แปลงหนองบัวงาม', sizeRai: 3, sizeNgan: 1, sizeSqWah: 20, lat: 18.9115, lng: 98.9405, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 008', memberIds: ['MEM-008'], name: 'แปลงร่มไม้ชายทุ่ง', sizeRai: 2, sizeNgan: 2, sizeSqWah: 0, lat: 18.9180, lng: 98.9430, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 009', memberIds: ['MEM-009'], name: 'แปลงม่อนแสงจันทร์', sizeRai: 4, sizeNgan: 0, sizeSqWah: 50, lat: 18.9108, lng: 98.9482, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 010', memberIds: ['MEM-010'], name: 'แปลงสวนเกสรทอง', sizeRai: 1, sizeNgan: 1, sizeSqWah: 80, lat: 18.9148, lng: 98.9490, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 011', memberIds: ['MEM-011'], name: 'แปลงห้วยน้ำริน', sizeRai: 2, sizeNgan: 0, sizeSqWah: 25, lat: 18.9168, lng: 98.9398, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 012', memberIds: ['MEM-012'], name: 'แปลงดอนมูลพัฒนา', sizeRai: 1, sizeNgan: 2, sizeSqWah: 60, lat: 18.9128, lng: 98.9460, status: 'active', plantType: 'เก๊กฮวย' },
  { id: 'P - 013', memberIds: ['MEM-013'], name: 'แปลงสันป่าเปา', sizeRai: 3, sizeNgan: 0, sizeSqWah: 0, lat: 18.9192, lng: 98.9412, status: 'active', plantType: 'คาโมมายล์' },
  { id: 'P - 014', memberIds: ['MEM-014'], name: 'แปลงสวนสมุนไพรทวีสุข', sizeRai: 2, sizeNgan: 3, sizeSqWah: 10, lat: 18.9152, lng: 98.9515, status: 'active', plantType: 'เก๊กฮวย' }
];

// Mock crop seasons for initial plots (Format: [YearBE2digits][Running2digits], e.g. 6901)
const MOCK_CROPS = [
  {
    id: '2569/P - 001/1',
    plotId: 'P - 001',
    plantDate: '2026-08-27',
    harvestDateEst: '2026-11-27',
    fertDateEst: '2026-09-10',
    harvestDateActual: null,
    seedlingCount: 800,
    seedlingSource: 'เก๊กฮวย',
    cost: 4500,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าเก๊กฮวยแปลงสวนหน้าบ้าน เตรียมดินด้วยปุ๋ยหมักชีวภาพ',
    fertilizingLog: [
      { date: '2026-08-27', type: 'ปุ๋ยหมักชีวภาพสูตรเตรียมดิน', amount: '30 กิโลกรัม', cost: 450, note: 'รองพื้นก่อนลงกล้า' }
    ]
  },
  {
    id: '2569/P - 002/1',
    plotId: 'P - 002',
    plantDate: '2026-08-28',
    harvestDateEst: '2026-11-28',
    fertDateEst: '2026-09-12',
    harvestDateActual: null,
    seedlingCount: 500,
    seedlingSource: 'คาโมมายล์',
    cost: 3200,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าคาโมมายล์ แปลงริมคลองส่งน้ำ',
    fertilizingLog: [
      { date: '2026-08-28', type: 'ปุ๋ยคอกมูลไก่หมัก', amount: '25 กิโลกรัม', cost: 300, note: 'บำรุงต้นกล้าเริ่มต้น' }
    ]
  },
  {
    id: '2569/P - 003/1',
    plotId: 'P - 003',
    plantDate: '2026-09-01',
    harvestDateEst: '2026-12-01',
    fertDateEst: '2026-09-15',
    harvestDateActual: null,
    seedlingCount: 1200,
    seedlingSource: 'เก๊กฮวย',
    cost: 5500,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าเก๊กฮวย แปลงเชิงเขาม่อนแก้ว',
    fertilizingLog: []
  },
  {
    id: '2569/P - 004/1',
    plotId: 'P - 004',
    plantDate: '2026-09-05',
    harvestDateEst: '2026-12-05',
    fertDateEst: '2026-09-20',
    harvestDateActual: null,
    seedlingCount: 650,
    seedlingSource: 'คาโมมายล์',
    cost: 3800,
    yield: null,
    status: 'growing',
    cropYear: 2569,
    cropCycle: 1,
    note: 'ลงกล้าคาโมมายล์ แปลงใกล้หอประชุม',
    fertilizingLog: []
  },
  {
    id: '2568/P - 001/1',
    plotId: 'P - 001',
    plantDate: '2026-01-05',
    harvestDateEst: '2026-04-05',
    harvestDateActual: '2026-04-08',
    seedlingCount: 800,
    seedlingSource: 'เก๊กฮวย',
    cost: 4200,
    yield: 150.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-04-10',
    freshUsed: 150.0,
    dryWeight: 15.0,
    cropYear: 2568,
    cropCycle: 1,
    note: 'รอบปลูกเก๊กฮวย รอบที่ 1 เก็บเกี่ยวผลผลิตสด 150 กก. อบแห้งได้ 15 กก. (อัตราส่วนมาตรฐาน 10:1)',
    harvestNote: 'ดอกสดสมบูรณ์ คุณภาพเกรด A อบแห้งกลิ่นหอม สีทองสดใส',
    fertilizingLog: [
      { date: '2026-01-10', type: 'ปุ๋ยหมักชีวภาพสูตรใบ', amount: '20 กิโลกรัม', cost: 350 }
    ]
  },
  {
    id: '2568/P - 001/2',
    plotId: 'P - 001',
    plantDate: '2026-04-20',
    harvestDateEst: '2026-07-20',
    harvestDateActual: '2026-07-25',
    seedlingCount: 850,
    seedlingSource: 'เก๊กฮวย',
    cost: 4600,
    yield: 170.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-07-27',
    freshUsed: 170.0,
    dryWeight: 17.0,
    cropYear: 2568,
    cropCycle: 2,
    note: 'รอบปลูกเก๊กฮวย รอบที่ 2 ผลผลิตดีเยี่ยม อบแห้งตามอัตราส่วน 10:1',
    harvestNote: 'ดอกสดหนา กลิ่นหอมแรง อบแห้งได้มาตรฐาน GAP',
    fertilizingLog: [
      { date: '2026-04-25', type: 'ปุ๋ยอินทรีย์อัดเม็ด', amount: '25 กิโลกรัม', cost: 400 }
    ]
  },
  {
    id: '2568/P - 002/1',
    plotId: 'P - 002',
    plantDate: '2026-01-15',
    harvestDateEst: '2026-04-15',
    harvestDateActual: '2026-04-18',
    seedlingCount: 500,
    seedlingSource: 'คาโมมายล์',
    cost: 3200,
    yield: 100.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-04-20',
    freshUsed: 100.0,
    dryWeight: 10.0,
    cropYear: 2568,
    cropCycle: 1,
    note: 'รอบปลูกคาโมมายล์ รอบที่ 1 ผลผลิตสด 100 กก. อบแห้งได้ 10 กก. (10:1)',
    harvestNote: 'ดอกแห้งหอมมาก สะอาด ปลอดสารเคมี 100%',
    fertilizingLog: [
      { date: '2026-01-20', type: 'ปุ๋ยคอกเตรียมดิน', amount: '30 กิโลกรัม', cost: 400 }
    ]
  },
  {
    id: '2568/P - 002/2',
    plotId: 'P - 002',
    plantDate: '2026-05-01',
    harvestDateEst: '2026-08-01',
    harvestDateActual: '2026-08-04',
    seedlingCount: 550,
    seedlingSource: 'คาโมมายล์',
    cost: 3400,
    yield: 90.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-08-06',
    freshUsed: 90.0,
    dryWeight: 9.0,
    cropYear: 2568,
    cropCycle: 2,
    note: 'รอบปลูกคาโมมายล์ รอบที่ 2 บำรุงอินทรีย์สมบูรณ์ อบแห้ง (10:1)',
    harvestNote: 'กลิ่นหอมละมุน ผ่านเกณฑ์รับรองอินทรีย์วิถีไทย',
    fertilizingLog: [
      { date: '2026-05-10', type: 'น้ำหมักชีวภาพปลาทะเล', amount: '20 ลิตร', cost: 320 }
    ]
  },
  {
    id: '2568/P - 003/1',
    plotId: 'P - 003',
    plantDate: '2026-01-20',
    harvestDateEst: '2026-04-20',
    harvestDateActual: '2026-04-25',
    seedlingCount: 1000,
    seedlingSource: 'เก๊กฮวย',
    cost: 4800,
    yield: 180.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-04-28',
    freshUsed: 180.0,
    dryWeight: 18.0,
    cropYear: 2568,
    cropCycle: 1,
    note: 'เก๊กฮวยม่อนแก้ว รอบที่ 1 สด 180 กก. ได้แห้ง 18 กก. (10:1)',
    harvestNote: 'ดอกสวย สีเหลืองทองสว่าง คัดเกรดพิเศษ',
    fertilizingLog: []
  },
  {
    id: '2568/P - 003/2',
    plotId: 'P - 003',
    plantDate: '2026-05-10',
    harvestDateEst: '2026-08-10',
    harvestDateActual: '2026-08-15',
    seedlingCount: 1100,
    seedlingSource: 'เก๊กฮวย',
    cost: 5100,
    yield: 190.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-08-18',
    freshUsed: 190.0,
    dryWeight: 19.0,
    cropYear: 2568,
    cropCycle: 2,
    note: 'เก๊กฮวยม่อนแก้ว รอบที่ 2 เก็บเกี่ยวและอบแห้งแล้ว (10:1)',
    harvestNote: 'ได้ผลผลิตสูง ดอกแน่น ส่งอบแห้งทันที',
    fertilizingLog: []
  },
  {
    id: '2568/P - 003/3',
    plotId: 'P - 003',
    plantDate: '2026-08-20',
    harvestDateEst: '2026-11-20',
    harvestDateActual: '2026-11-25',
    seedlingCount: 1050,
    seedlingSource: 'เก๊กฮวย',
    cost: 5000,
    yield: 180.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-11-28',
    freshUsed: 180.0,
    dryWeight: 18.0,
    cropYear: 2568,
    cropCycle: 3,
    note: 'เก๊กฮวยม่อนแก้ว รอบที่ 3 สด 180 กก. ได้แห้ง 18 กก. (10:1)',
    harvestNote: 'คุณภาพดีเยี่ยม สีทอง กลิ่นหอมฟุ้ง',
    fertilizingLog: []
  },
  {
    id: '2568/P - 004/1',
    plotId: 'P - 004',
    plantDate: '2026-02-01',
    harvestDateEst: '2026-05-01',
    harvestDateActual: '2026-05-05',
    seedlingCount: 600,
    seedlingSource: 'คาโมมายล์',
    cost: 3500,
    yield: 85.0,
    status: 'harvested',
    isProcessed: false,
    cropYear: 2568,
    cropCycle: 1,
    note: 'เก็บเกี่ยวดอกสดคาโมมายล์รอบ 1 เรียบร้อยแล้ว รอส่งเข้าตู้อบแห้ง',
    harvestNote: 'ดอกสดสมบูรณ์ รอคิวเตาอบที่ 2',
    fertilizingLog: []
  },
  {
    id: '2568/P - 005/1',
    plotId: 'P - 005',
    plantDate: '2026-02-10',
    harvestDateEst: '2026-05-10',
    harvestDateActual: '2026-05-15',
    seedlingCount: 750,
    seedlingSource: 'เก๊กฮวย',
    cost: 4100,
    yield: 140.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-05-18',
    freshUsed: 140.0,
    dryWeight: 14.0,
    cropYear: 2568,
    cropCycle: 1,
    note: 'แปลงทุ่งรวงทอง รอบที่ 1 สด 140 กก. ได้แห้ง 14 กก. (10:1)',
    harvestNote: 'ดอกสดสวยงาม ไร้สารเคมี',
    fertilizingLog: []
  },
  {
    id: '2568/P - 005/2',
    plotId: 'P - 005',
    plantDate: '2026-06-01',
    harvestDateEst: '2026-09-01',
    harvestDateActual: '2026-09-05',
    seedlingCount: 800,
    seedlingSource: 'เก๊กฮวย',
    cost: 4300,
    yield: 150.0,
    status: 'harvested',
    isProcessed: true,
    dryingDate: '2026-09-08',
    freshUsed: 150.0,
    dryWeight: 15.0,
    cropYear: 2568,
    cropCycle: 2,
    note: 'แปลงทุ่งรวงทอง รอบที่ 2 สด 150 กก. ได้แห้ง 15 กก. (10:1)',
    harvestNote: 'ดอกสมบูรณ์ดีมาก เก็บเกี่ยวได้ตามเป้าหมาย',
    fertilizingLog: []
  }
];

// Mock inventory split by cropId (Phase 2 core feature)
const MOCK_INVENTORY = [
  { cropId: '2568/P - 001/1', herbType: 'เก๊กฮวย', dryStockKg: 15.0, processedDate: '2026-06-07' },
  { cropId: '2568/P - 002/1', herbType: 'คาโมมายล์', dryStockKg: 10.0, processedDate: '2026-06-20' }
];

// Mock Products Catalog for Inventory Management (PRD-XXX)
const MOCK_PRODUCTS = [
  {
    id: 'PRD-001',
    name: 'ดอกเก๊กฮวยอบแห้ง (1 กก.)',
    price: 250,
    unit: 'กก.',
    stock: 25.0,
    category: 'เก๊กฮวย',
    updatedDate: '2026-06-07'
  },
  {
    id: 'PRD-002',
    name: 'ดอกคาโมมายล์อบแห้ง (1 กก.)',
    price: 450,
    unit: 'กก.',
    stock: 15.0,
    category: 'คาโมมายล์',
    updatedDate: '2026-06-20'
  },
  {
    id: 'PRD-003',
    name: 'เก๊กฮวยกระป๋อง (50 G)',
    price: 150,
    unit: 'กระป๋อง',
    stock: 100,
    category: 'เก๊กฮวย',
    updatedDate: '2026-07-01'
  },
  {
    id: 'PRD-004',
    name: 'คาโมมายล์กระป๋อง (50 G)',
    price: 100,
    unit: 'กระป๋อง',
    stock: 50,
    category: 'คาโมมายล์',
    updatedDate: '2026-07-01'
  },
  {
    id: 'PRD-005',
    name: 'ชาเก๊กฮวยแบบกระป๋อง',
    price: 95,
    unit: 'กระป๋อง',
    stock: 80,
    category: 'เก๊กฮวย',
    updatedDate: '2026-07-05'
  },
  {
    id: 'PRD-006',
    name: 'เก๊กฮวยกระป๋อง (100 กรัม)',
    price: 280,
    unit: 'กระป๋อง',
    stock: 0,
    category: 'เก๊กฮวย',
    updatedDate: '2026-07-05'
  },
  {
    id: 'PRD-007',
    name: 'คาโมมายล์กระป๋อง (100 กรัม)',
    price: 180,
    unit: 'กระป๋อง',
    stock: 0,
    category: 'คาโมมายล์',
    updatedDate: '2026-07-05'
  }
];


// Mock Customers
const MOCK_CUSTOMERS = [
  {
    id: 'CUST-001',
    name: 'ร้านชาสมุนไพรม่อนแจ่ม',
    customerType: 'ร้านคาเฟ่/ร้านขายของฝาก',
    phone: '081-998-1122',
    lineId: '@monchamtea',
    facebook: 'ม่อนแจ่ม ชาสมุนไพรแท้',
    address: '99 ม.7 ต.แม่แรม อ.แม่ริม จ.เชียงใหม่ 50180',
    contactChannel: 'Line: @monchamtea'
  },
  {
    id: 'CUST-002',
    name: 'กลุ่มท่องเที่ยวแม่ริม',
    customerType: 'ตัวแทนจำหน่าย',
    phone: '089-776-5544',
    lineId: 'maerim_tour',
    facebook: 'กลุ่มท่องเที่ยวแม่ริม Maerim Travel',
    address: '15/2 ถ.โชตนา ต.ริมใต้ อ.แม่ริม จ.เชียงใหม่ 50180',
    contactChannel: 'FB: MaerimTravelGroup'
  },
  {
    id: 'CUST-003',
    name: 'คุณสมหญิง อารีย์พร',
    customerType: 'ลูกค้าทั่วไป',
    phone: '084-332-1100',
    lineId: 'somying.a',
    facebook: 'Somying Areephon',
    address: '108 ม.2 ต.ศรีดอนมูล อ.เชียงแสน จ.เชียงราย 57150',
    contactChannel: 'โทรศัพท์'
  },
  {
    id: 'CUST-004',
    name: 'โรงงานเวชสำอางสมุนไพรล้านนา',
    customerType: 'ซื้อส่งโรงงาน',
    phone: '053-219-880',
    lineId: '@lannaherb_factory',
    facebook: 'โรงงานสมุนไพรล้านนาแล็บ',
    address: '45/1 นิคมอุตสาหกรรมภาคเหนือ ต.บ้านกลาง อ.เมือง จ.ลำพูน 51000',
    contactChannel: 'Line: @lannaherb_factory'
  },
  {
    id: 'CUST-005',
    name: 'ร้านคาเฟ่บ้านชาดอนมูล',
    customerType: 'ร้านคาเฟ่/ร้านขายของฝาก',
    phone: '082-555-8901',
    lineId: '@donmun_tea',
    facebook: 'บ้านชาดอนมูล Organic Cafe',
    address: '22 ม.3 ต.ศรีดอนมูล อ.เชียงแสน จ.เชียงราย 57150',
    contactChannel: 'Line: @donmun_tea'
  },
  {
    id: 'CUST-006',
    name: 'คุณนภาพร วงศ์สว่าง',
    customerType: 'ลูกค้าทั่วไป',
    phone: '086-444-2211',
    lineId: 'naphaporn.w',
    facebook: 'Naphaporn Wongsawang',
    address: '55/9 ถ.พหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900',
    contactChannel: 'FB: Naphaporn Wongsawang'
  }
];

// Mock sales transactions linked to specific cropIds
const MOCK_SALES = [
  { id: 'SALE-001', cropId: '2568/P - 001/1', amountKg: 5.0, pricePerKg: 250, totalPrice: 1250, customerId: 'CUST-001', customer: 'ร้านชาสมุนไพรม่อนแจ่ม', date: '2026-06-15' },
  { id: 'SALE-002', cropId: '2568/P - 002/1', amountKg: 5.0, pricePerKg: 450, totalPrice: 2250, customerId: 'CUST-002', customer: 'กลุ่มท่องเที่ยวแม่ริม', date: '2026-06-25' }
];

// Default Standard Planting Roadmaps (แผนการปลูกสมุนไพรมาตรฐาน)
export const DEFAULT_ROADMAPS = {
  'เก๊กฮวย': {
    name: 'เก๊กฮวย',
    icon: '🌼',
    description: 'พืชสมุนไพรเด่น ดอกสีเหลืองทอง กลิ่นหอม บำรุงตับ ดับพิษร้อน ปลูกง่าย ผลผลิตคุ้มค่า',
    durationDays: 90,
    cycleText: 'ระยะเวลาเพาะปลูกรวมประมาณ 90 วัน',
    steps: [
      {
        stepNo: 1,
        title: 'ลงต้นกล้า',
        dayNumber: 1,
        dayLabel: 'วันที่ 1',
        advice: 'รองก้นหลุม/เริ่มปลูก',
        detail: 'รองก้นหลุมด้วยปุ๋ยหมักชีวภาพหรือปุ๋ยคอกหมัก รดน้ำแปลงให้ชุ่มชื้น คลุมโคนต้นด้วยฟางข้าวเพื่อรักษาความชื้น',
        color: 'emerald',
        icon: 'fa-seedling'
      },
      {
        stepNo: 2,
        title: 'ใส่ปุ๋ยบำรุงครั้งที่ 1',
        dayNumber: 30,
        dayLabel: 'วันที่ 30',
        advice: 'เร่งต้น/ใบ',
        detail: 'ใส่ปุ๋ยหมักชีวภาพสูตรบำรุงต้นและใบ พรวนดินรอบโคนต้นอย่างระมัดระวัง กำจัดวัชพืช พร้อมให้น้ำอย่างสม่ำเสมอสัปดาห์ละ 2-3 ครั้ง',
        color: 'teal',
        icon: 'fa-leaf'
      },
      {
        stepNo: 3,
        title: 'ใส่ปุ๋ยบำรุงครั้งที่ 2',
        dayNumber: 60,
        dayLabel: 'วันที่ 60',
        advice: 'เร่งตาดอก',
        detail: 'ใส่ปุ๋ยอินทรีย์เสริมธาตุฟอสฟอรัสและโพแทสเซียม (มูลค้างคาวหรือปุ๋ยหมักพิเศษ) เพื่อเร่งตาดอกให้ดก ดอกสมบูรณ์ สีเหลืองเข้มสด',
        color: 'amber',
        icon: 'fa-sun'
      },
      {
        stepNo: 4,
        title: 'เก็บเกี่ยวผลผลิต',
        dayNumber: 90,
        dayLabel: 'วันที่ 90',
        advice: 'เก็บเกี่ยวส่งโรงอบ',
        detail: 'เก็บเกี่ยวดอกเก๊กฮวยที่บานประมาณ 70-80% ในช่วงเช้าตรู่ (06:00-09:00 น.) ก่อนแดดจัด คัดแยกสิ่งเจือปน และนำส่งเข้าเตาอบแห้งภายในวันเดียวกัน',
        color: 'rose',
        icon: 'fa-basket-shopping'
      }
    ]
  },
  'คาโมมายล์': {
    name: 'คาโมมายล์',
    icon: '🌿',
    description: 'สมุนไพรเพื่อการผ่อนคลาย ดอกสีขาวเกสรเหลือง ช่วยให้นอนหลับสบาย ต้านการอักเสบ',
    durationDays: 85,
    cycleText: 'ระยะเวลาเพาะปลูกรวมประมาณ 80 - 85 วัน',
    steps: [
      {
        stepNo: 1,
        title: 'ลงแปลงปลูก/ย้ายกล้า',
        dayNumber: 1,
        dayLabel: 'วันที่ 1',
        advice: 'รองก้นหลุม/เริ่มปลูก',
        detail: 'ยกร่องแปลงปลูก ดินร่วนซุยระบายน้ำดี รองก้นหลุมด้วยปุ๋ยหมักอินทรีย์ ปลูกระยะห่าง 25-30 ซม. รดน้ำละอองฝอย',
        color: 'emerald',
        icon: 'fa-seedling'
      },
      {
        stepNo: 2,
        title: 'ใส่ปุ๋ยบำรุงครั้งที่ 1',
        dayNumber: 25,
        dayLabel: 'วันที่ 25',
        advice: 'เร่งต้น/ราก',
        detail: 'ใส่ปุ๋ยหมักชีวภาพหรือน้ำหมักจุลินทรีย์เจือจาง เพื่อพัฒนาระบบรากและแตกกิ่งก้าน พรวนดินตื้นๆ ไม่ให้กระทบรากฝอย',
        color: 'teal',
        icon: 'fa-water'
      },
      {
        stepNo: 3,
        title: 'ใส่ปุ๋ยบำรุงครั้งที่ 2',
        dayNumber: 50,
        dayLabel: 'วันที่ 50',
        advice: 'เร่งตาดอก',
        detail: 'บำรุงด้วยปุ๋ยอินทรีย์สูตรเร่งดอกและเสริมความแข็งแรงของก้านดอก ตรวจสอบความชื้นแปลงไม่ให้แฉะเกินไป',
        color: 'amber',
        icon: 'fa-spa'
      },
      {
        stepNo: 4,
        title: 'เก็บเกี่ยวผลผลิต',
        dayNumber: 80,
        dayLabel: 'วันที่ 80',
        advice: 'เก็บเกี่ยวส่งโรงอบ',
        detail: 'เด็ดเก็บเฉพาะดอกที่กลีบสีขาวบานราบเต็มที่ ช่วงสายหลังน้ำค้างแห้ง ส่งเข้าตู้อบแห้งลมร้อนอุณหภูมิ 45-50°C เพื่อรักษากลิ่นหอมระเหย',
        color: 'rose',
        icon: 'fa-basket-shopping'
      }
    ]
  }
};

export class AppState {
  constructor() {
    this.onAuthChange = null;
    this.onEnterpriseChange = null;
    this.membersCache = [];
    this.plotsCache = [];
    this.cropsCache = [];
    this.inventoryCache = [];
    this.salesCache = [];
    this.customersCache = [];
    this.init();
  }

  initSupabase() {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    if (url && key && typeof supabase !== 'undefined') {
      try {
        supabaseClient = supabase.createClient(url, key);
        console.log("Supabase Client initialized successfully!");
      } catch (e) {
        console.error("Failed to initialize Supabase client:", e);
        supabaseClient = null;
      }
    } else {
      supabaseClient = null;
    }
  }

  async syncFromSupabase() {
    if (!supabaseClient) return;

    try {
      console.log("Syncing from Supabase...");

      // 1. Sync enterprise profile
      const { data: entData, error: entError } = await supabaseClient
        .from('enterprise_profile')
        .select('*')
        .single();
      
      if (!entError && entData) {
        localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(entData));
        if (this.onEnterpriseChange) {
          this.onEnterpriseChange(entData);
        }
      } else if (entError && entError.code === 'PGRST116') {
        // Table is empty, seed initial data
        const profile = this.getEnterprise();
        await supabaseClient.from('enterprise_profile').insert([{ id: 1, ...profile }]);
      }

      // 2. Sync members
      const { data: membersData, error: memError } = await supabaseClient
        .from('members')
        .select('*')
        .order('id', { ascending: true });
      
      if (!memError && membersData && membersData.length > 0) {
        this.membersCache = membersData;
      } else if (membersData && membersData.length === 0) {
        await supabaseClient.from('members').insert(MOCK_MEMBERS);
        this.membersCache = JSON.parse(JSON.stringify(MOCK_MEMBERS));
      }

      // 3. Sync plots
      const { data: plotsData, error: plotsError } = await supabaseClient
        .from('plots')
        .select('*')
        .order('id', { ascending: true });
      
      if (!plotsError && plotsData && plotsData.length > 0) {
        this.plotsCache = plotsData.map(p => ({
          ...p,
          sizeRai: p.size_rai,
          sizeNgan: p.size_ngan,
          sizeSqWah: p.size_sq_wah,
          plantType: p.plant_type,
          memberIds: p.member_ids
        }));
      } else if (plotsData && plotsData.length === 0) {
        const plotsToInsert = MOCK_PLOTS.map(p => ({
          id: p.id,
          name: p.name,
          member_ids: p.memberIds,
          size_rai: p.sizeRai,
          size_ngan: p.sizeNgan,
          size_sq_wah: p.sizeSqWah,
          plant_type: p.plantType,
          lat: p.lat,
          lng: p.lng,
          status: p.status
        }));
        await supabaseClient.from('plots').insert(plotsToInsert);
        this.plotsCache = JSON.parse(JSON.stringify(MOCK_PLOTS));
      }

      // 4. Sync crops
      const { data: cropsData, error: cropsError } = await supabaseClient
        .from('crops')
        .select('*')
        .order('id', { ascending: true });
      
      if (!cropsError && cropsData && cropsData.length > 0) {
        this.cropsCache = cropsData.map(c => ({
          ...c,
          plotId: c.plot_id,
          cropYear: c.crop_year,
          harvestDateEst: c.harvest_date_est || '',
          harvestDateActual: c.harvest_date_actual || null,
          fertilizingLog: c.fertilizing_log || []
        }));
      } else if (cropsData && cropsData.length === 0) {
        const cropsToInsert = MOCK_CROPS.map(c => ({
          id: c.id,
          plot_id: c.plotId,
          plant_date: c.plantDate,
          cost: c.cost,
          crop_year: c.cropYear,
          harvest_date_est: c.harvestDateEst || null,
          harvest_date_actual: c.harvestDateActual || null,
          yield: c.yield || null,
          status: c.status,
          fertilizing_log: c.fertilizingLog || []
        }));
        await supabaseClient.from('crops').insert(cropsToInsert);
        this.cropsCache = JSON.parse(JSON.stringify(MOCK_CROPS));
      }

      // 5. Sync inventory
      const { data: invData, error: invError } = await supabaseClient
        .from('inventory')
        .select('*')
        .order('id', { ascending: true });
      
      if (!invError && invData && invData.length > 0) {
        this.inventoryCache = invData.map(i => ({
          ...i,
          cropId: i.crop_id,
          dryStockKg: i.dry_stock_kg,
          dryDate: i.dry_date,
          qualityGrade: i.quality_grade,
          costPerKg: i.cost_per_kg
        }));
      } else if (invData && invData.length === 0) {
        const invToInsert = MOCK_INVENTORY.map(i => ({
          id: i.id,
          crop_id: i.cropId,
          dry_stock_kg: i.dryStockKg,
          dry_date: i.dryDate,
          quality_grade: i.qualityGrade,
          cost_per_kg: i.costPerKg,
          status: i.status,
          history: i.history || []
        }));
        this.inventoryCache = JSON.parse(JSON.stringify(MOCK_INVENTORY));
      }

      // 6. Sync sales
      const { data: salesData, error: salesError } = await supabaseClient
        .from('sales')
        .select('*')
        .order('id', { ascending: true });
      
      if (!salesError && salesData && salesData.length > 0) {
        this.salesCache = salesData.map(s => ({
          ...s,
          inventoryId: s.inventory_id,
          quantityKg: s.quantity_kg,
          pricePerKg: s.price_per_kg,
          saleDate: s.sale_date,
          buyerPhone: s.buyer_phone,
          invoiceNo: s.invoice_no,
          totalPrice: s.quantity_kg * s.price_per_kg
        }));
      } else if (salesData && salesData.length === 0) {
        const salesToInsert = MOCK_SALES.map((s, idx) => {
          const invItem = this.inventoryCache.find(i => i.cropId === s.cropId);
          return {
            id: s.id,
            inventory_id: invItem ? invItem.id : 'INV-001',
            customer_name: s.customer,
            quantity_kg: s.amountKg,
            price_per_kg: s.pricePerKg,
            sale_date: s.date,
            buyer_phone: '081-234-5600',
            invoice_no: `INV-${String(idx + 1).padStart(3, '0')}`
          };
        });
        await supabaseClient.from('sales').insert(salesToInsert);
        this.salesCache = MOCK_SALES.map((s, idx) => {
          const invItem = this.inventoryCache.find(i => i.cropId === s.cropId);
          return {
            ...s,
            inventoryId: invItem ? invItem.id : 'INV-001',
            quantityKg: s.amountKg,
            pricePerKg: s.pricePerKg,
            saleDate: s.date,
            buyerPhone: '081-234-5600',
            invoiceNo: `INV-${String(idx + 1).padStart(3, '0')}`,
            totalPrice: s.amountKg * s.pricePerKg
          };
        });
      }

      console.log("Supabase sync completed successfully!");
    } catch (e) {
      console.error("Sync error:", e);
      throw e;
    }
  }

  // --- Auth & Session Methods ---
  getCurrentUser() {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  login(username, password) {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim().replace(/-/g, '');

    const members = this.getMembers();
    const member = members.find(m => m.houseNumber && m.houseNumber.trim() === cleanUsername);
    if (!member) {
      throw new Error('ไม่พบบัญชีผู้ใช้งานที่มีเลขที่บ้านนี้');
    }

    const memberPhoneClean = member.phone.replace(/-/g, '');
    if (memberPhoneClean !== cleanPassword) {
      throw new Error('รหัสผ่าน (เบอร์โทรศัพท์) ไม่ถูกต้อง');
    }

    // Determine role
    let appRole = 'Member';
    if (member.id === 'MEM-001' || member.role === 'ประธานกลุ่ม') {
      appRole = 'Admin';
    } else if (member.id === 'MEM-003' || member.role === 'เหรัญญิก') {
      appRole = 'Officer';
    }

    const sessionData = {
      username: cleanUsername,
      name: member.name,
      role: appRole,
      roleDisplay: member.role,
      memberId: member.id,
      avatarText: member.name.charAt(0) || 'M',
      color: appRole === 'Admin' ? 'emerald' : (appRole === 'Officer' ? 'amber' : 'blue'),
      loginTime: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(sessionData));
    if (this.onAuthChange) this.onAuthChange(sessionData);
    return sessionData;
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    if (this.onAuthChange) this.onAuthChange(null);
  }

  getDemoUsers() {
    return MOCK_USERS;
  }

  /**
   * Reset all simulation data to fresh pristine state
   */
  resetAllSimulationData() {
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
    localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(MOCK_CROPS));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(MOCK_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(MOCK_SALES));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
    localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(MOCK_DRYING_BATCHES));
    localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(MOCK_PACKAGING_BATCHES));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));

    // Ensure session is set
    if (!this.getCurrentUser()) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(MOCK_USERS[0]));
    }

    // Refresh memory caches
    this.plotsCache = JSON.parse(JSON.stringify(MOCK_PLOTS));
    this.membersCache = JSON.parse(JSON.stringify(MOCK_MEMBERS));
    this.cropsCache = JSON.parse(JSON.stringify(MOCK_CROPS));
    this.inventoryCache = JSON.parse(JSON.stringify(MOCK_INVENTORY));
    this.salesCache = JSON.parse(JSON.stringify(MOCK_SALES));
    this.customersCache = JSON.parse(JSON.stringify(MOCK_CUSTOMERS));

    if (this.onEnterpriseChange) {
      this.onEnterpriseChange(DEFAULT_ENTERPRISE);
    }
    if (this.onAuthChange) {
      this.onAuthChange(this.getCurrentUser());
    }
  }

  init() {
    this.initSupabase();

    const SIMULATION_RESET_KEY = 'herb_enterprise_sim_ver_v9';
    if (localStorage.getItem('herb_enterprise_sim_ver') !== SIMULATION_RESET_KEY) {
      this.resetAllSimulationData();
      localStorage.setItem('herb_enterprise_sim_ver', SIMULATION_RESET_KEY);
      localStorage.setItem('herb_enterprise_products_price_v6', 'done');
      if (supabaseClient) {
        this.syncFromSupabase().catch(e => console.error("Initial Supabase sync failed:", e));
      }
      return;
    }
    
    // 1. Enterprise Setup
    const storedEnt = localStorage.getItem(STORAGE_KEYS.ENTERPRISE);
    if (!storedEnt) {
      localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
    } else {
      try {
        const ent = JSON.parse(storedEnt);
        if (ent && (ent.name === 'วิสาหกิจชุมชนสมุนไพรอบแห้งบ้านแม่ริม' || ent.district === 'แม่ริม')) {
          localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(DEFAULT_ENTERPRISE));
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // 2. Members
    const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!storedMembers) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(MOCK_MEMBERS));
    } else {
      try {
        const list = JSON.parse(storedMembers);
        const mem1 = list.find(m => m.id === 'MEM-001');
        // Migrate to houseNumber structure if needed
        if (mem1 && (!mem1.houseNumber || mem1.citizenId)) {
          list.forEach(m => {
            const mockVer = MOCK_MEMBERS.find(mock => mock.id === m.id);
            if (mockVer) {
              m.houseNumber = mockVer.houseNumber;
              m.phone = mockVer.phone;
            }
            delete m.citizenId;
          });
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(list));
          localStorage.removeItem(STORAGE_KEYS.AUTH); // Clear old session
        }
      } catch (e) {
        console.error("Migration error:", e);
      }
    }

    // 3. Plots
    const storedPlots = localStorage.getItem(STORAGE_KEYS.PLOTS);
    if (!storedPlots || JSON.parse(storedPlots).length === 0) {
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(MOCK_PLOTS));
    } else {
      try {
        const currentPlots = JSON.parse(storedPlots);
        let hasNew = false;
        MOCK_PLOTS.forEach(mockP => {
          const found = currentPlots.find(p => p.id === mockP.id);
          if (!found) {
            currentPlots.push(mockP);
            hasNew = true;
          } else if (!found.plantType && mockP.plantType) {
            found.plantType = mockP.plantType;
            hasNew = true;
          }
        });
        if (hasNew) {
          currentPlots.sort((a, b) => {
            const numA = parseInt((a.id || '').replace(/\D/g, '')) || 0;
            const numB = parseInt((b.id || '').replace(/\D/g, '')) || 0;
            return numA - numB;
          });
          localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(currentPlots));
        }
      } catch (err) {
        console.error("Plots sync error:", err);
      }
    }

    // 4. Crop Seasons (1 รอบมีได้ 1 แปลงเท่านั้น ไม่เขียนทับข้อมูลที่บันทึกแล้ว)
    const storedCrops = localStorage.getItem(STORAGE_KEYS.CROPS);
    if (!storedCrops || JSON.parse(storedCrops).length === 0) {
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(MOCK_CROPS));
    } else {
        // Automatic cleanup: Ensure in any (cropYear + cropCycle), each plot has at most 1 crop!
        // AND delete old crops that don't match the new Year/PlotID/Cycle format
      try {
        const cropsList = JSON.parse(storedCrops);
        MOCK_CROPS.forEach(mockC => {
          if (!cropsList.some(c => c.id === mockC.id)) {
            cropsList.push(mockC);
          }
        });
        const seen = new Set();
        const deduplicated = [];
        for (let i = cropsList.length - 1; i >= 0; i--) {
          const c = cropsList[i];
          // Delete old IDs by skipping them
          if (!String(c.id).includes('/')) {
            continue;
          }
          const key = `${c.plotId}_${c.cropYear}_${c.cropCycle || 1}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduplicated.unshift(c);
          }
        }
        if (deduplicated.length !== cropsList.length || deduplicated.length > 0) {
          localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(deduplicated));
          
          // Also clean up Inventory and Sales referencing old IDs
          const storedInv = localStorage.getItem(STORAGE_KEYS.INVENTORY);
          if (storedInv) {
            const validInv = JSON.parse(storedInv).filter(i => String(i.cropId).includes('/'));
            localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(validInv));
          }
          const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
          if (storedSales) {
            const validSales = JSON.parse(storedSales).filter(s => String(s.cropId).includes('/'));
            localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(validSales));
          }
        }
      } catch (err) {
        console.error("Crops deduplication error:", err);
      }
    }

    // 5. Inventory (Phase 2)
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(MOCK_INVENTORY));

    // 6. Sales (Phase 2)
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(MOCK_SALES));
    }

    // 7. Customers (Auto-migrate lineId & facebook fields)
    const storedCust = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!storedCust) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(MOCK_CUSTOMERS));
    } else {
      try {
        let custList = JSON.parse(storedCust);
        let updated = false;
        custList.forEach(c => {
          const mockMatch = MOCK_CUSTOMERS.find(m => m.id === c.id);
          if (mockMatch) {
            if (!c.lineId && mockMatch.lineId) { c.lineId = mockMatch.lineId; updated = true; }
            if (!c.facebook && mockMatch.facebook) { c.facebook = mockMatch.facebook; updated = true; }
          }
          if (!c.lineId && c.contactChannel && c.contactChannel.toLowerCase().includes('line')) {
            c.lineId = c.contactChannel.replace(/line\s*:\s*/i, '').trim();
            updated = true;
          }
          if (!c.facebook && c.contactChannel && (c.contactChannel.toLowerCase().includes('fb') || c.contactChannel.toLowerCase().includes('facebook'))) {
            c.facebook = c.contactChannel.replace(/fb\s*:\s*|facebook\s*:\s*/i, '').trim();
            updated = true;
          }
        });
        MOCK_CUSTOMERS.forEach(m => {
          if (!custList.some(c => c.id === m.id)) {
            custList.push(m);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(custList));
        }
      } catch (e) {
        console.error("Customers migration error:", e);
      }
    }

    // 8. Planting Roadmaps
    if (!localStorage.getItem(STORAGE_KEYS.ROADMAPS)) {
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
    }

    // 9. Products Catalog (Finished Goods & Inventory PRD-XXX)
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
    }

    // 10. Packaging Batches (Canning & Packaging process logs)
    if (!localStorage.getItem(STORAGE_KEYS.PACKAGING_BATCHES)) {
      localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(MOCK_PACKAGING_BATCHES));
    }

    // Trigger asynchronous Supabase synchronization if connected
    if (supabaseClient) {
      this.syncFromSupabase().catch(e => {
        console.error("Initial Supabase sync failed:", e);
      });
    }
  }

  // --- Enterprise Profile Methods ---
  getEnterprise() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ENTERPRISE));
  }

  saveEnterprise(data) {
    if (supabaseClient) {
      supabaseClient.from('enterprise_profile').update(data).eq('id', 1).then(({ error }) => {
        if (error) console.error("Supabase enterprise save error:", error);
      });
    }
    localStorage.setItem(STORAGE_KEYS.ENTERPRISE, JSON.stringify(data));
    if (this.onEnterpriseChange) {
      this.onEnterpriseChange(data);
    }
    return data;
  }

  // --- Members Methods ---
  getMembers() {
    if (supabaseClient) {
      return this.membersCache;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const list = data ? JSON.parse(data) : MOCK_MEMBERS;
      return (list || []).filter(m => m && typeof m === 'object' && m.id);
    } catch (e) {
      return MOCK_MEMBERS;
    }
  }

  getMemberById(id) {
    return this.getMembers().find(m => m.id === id);
  }

  addMember(member) {
    const members = this.getMembers();
    const maxIdNum = members.reduce((max, m) => {
      const num = parseInt(m.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newId = `MEM-${String(maxIdNum + 1).padStart(3, '0')}`;
    
    const newMember = {
      ...member,
      id: newId,
      joinDate: member.joinDate || new Date().toISOString().split('T')[0],
      status: member.status || 'active'
    };

    if (supabaseClient) {
      this.membersCache.push(newMember);
      supabaseClient.from('members').insert([newMember]).then(({ error }) => {
        if (error) {
          console.error("Supabase addMember error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    } else {
      members.push(newMember);
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }
    return newMember;
  }

  updateMember(id, updatedData) {
    let members = this.getMembers();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
      const updatedMember = { ...members[index], ...updatedData };
      
      if (supabaseClient) {
        this.membersCache[index] = updatedMember;
        supabaseClient.from('members').update(updatedData).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updateMember error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      } else {
        members[index] = updatedMember;
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      }
      return updatedMember;
    }
    return null;
  }

  deleteMember(id) {
    let members = this.getMembers();
    const plots = this.getPlots().filter(p => p.memberIds && p.memberIds.includes(id));
    if (plots.length > 0) {
      throw new Error(`ไม่สามารถลบสมาชิกได้เนื่องจากสมาชิกมีแปลงปลูกอยู่ในระบบ (${plots.length} แปลง)`);
    }

    if (supabaseClient) {
      this.membersCache = this.membersCache.filter(m => m.id !== id);
      supabaseClient.from('members').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteMember error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    } else {
      const filtered = members.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(filtered));
    }
    return true;
  }

  // --- Plots Methods ---
  getPlots() {
    if (supabaseClient) {
      return this.plotsCache;
    }
    try {
      const plots = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLOTS)) || [];
      return (plots || []).filter(p => p && typeof p === 'object' && p.id);
    } catch (e) {
      return [];
    }
  }

  getPlotById(id) {
    return this.getPlots().find(p => p.id === id);
  }

  getPlotsByMemberId(memberId) {
    return this.getPlots().filter(p => p.memberIds && p.memberIds.includes(memberId));
  }

  addPlot(plot) {
    const plots = this.getPlots();
    const maxIdNum = plots.reduce((max, p) => {
      const num = parseInt(p.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newId = `P - ${String(maxIdNum + 1).padStart(3, '0')}`;
    
    let finalLat = parseFloat(plot.lat);
    let finalLng = parseFloat(plot.lng);
    if (!finalLat || !finalLng) {
      const randCoords = generateRandomCoordinates();
      finalLat = randCoords.lat;
      finalLng = randCoords.lng;
    }

    const newPlot = {
      ...plot,
      id: newId,
      sizeRai: parseInt(plot.sizeRai) || 0,
      sizeNgan: parseInt(plot.sizeNgan) || 0,
      sizeSqWah: parseInt(plot.sizeSqWah) || 0,
      lat: finalLat,
      lng: finalLng,
      status: plot.status || 'active'
    };
    
    if (supabaseClient) {
      this.plotsCache.push(newPlot);
      const dbPlot = {
        id: newPlot.id,
        name: newPlot.name,
        member_ids: newPlot.memberIds,
        size_rai: newPlot.sizeRai,
        size_ngan: newPlot.sizeNgan,
        size_sq_wah: newPlot.sizeSqWah,
        plant_type: newPlot.plantType,
        lat: newPlot.lat,
        lng: newPlot.lng,
        status: newPlot.status
      };
      supabaseClient.from('plots').insert([dbPlot]).then(({ error }) => {
        if (error) {
          console.error("Supabase addPlot error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    } else {
      plots.push(newPlot);
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
    }
    return newPlot;
  }

  updatePlot(id, updatedData) {
    let plots = this.getPlots();
    const index = plots.findIndex(p => p.id === id);
    if (index !== -1) {
      delete plots[index].memberId;
      const updatedPlot = { 
        ...plots[index], 
        ...updatedData,
        sizeRai: parseInt(updatedData.sizeRai) || 0,
        sizeNgan: parseInt(updatedData.sizeNgan) || 0,
        sizeSqWah: parseInt(updatedData.sizeSqWah) || 0,
        lat: parseFloat(updatedData.lat) || plots[index].lat,
        lng: parseFloat(updatedData.lng) || plots[index].lng
      };

      if (supabaseClient) {
        this.plotsCache[index] = updatedPlot;
        const dbPlotUpdate = {
          name: updatedPlot.name,
          member_ids: updatedPlot.memberIds,
          size_rai: updatedPlot.sizeRai,
          size_ngan: updatedPlot.sizeNgan,
          size_sq_wah: updatedPlot.sizeSqWah,
          plant_type: updatedPlot.plantType,
          lat: updatedPlot.lat,
          lng: updatedPlot.lng,
          status: updatedPlot.status
        };
        supabaseClient.from('plots').update(dbPlotUpdate).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updatePlot error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      } else {
        plots[index] = updatedPlot;
        localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(plots));
      }
      return updatedPlot;
    }
    return null;
  }

  deletePlot(id) {
    let plots = this.getPlots();
    const crops = this.getCrops().filter(c => c.plotId === id);
    if (crops.length > 0) {
      throw new Error(`ไม่สามารถลบแปลงปลูกได้เนื่องจากมีข้อมูลรอบการเพาะปลูกผูกอยู่ (${crops.length} รอบ)`);
    }

    if (supabaseClient) {
      this.plotsCache = this.plotsCache.filter(p => p.id !== id);
      supabaseClient.from('plots').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deletePlot error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    } else {
      const filtered = plots.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PLOTS, JSON.stringify(filtered));
    }
    return true;
  }

  // --- Crop Seasons Methods ---
  getCrops() {
    if (supabaseClient) {
      return this.cropsCache;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CROPS)) || [];
  }

  getCropById(id) {
    return this.getCrops().find(c => c.id === id);
  }

  getCropsByPlotId(plotId) {
    return this.getCrops().filter(c => c.plotId === plotId);
  }

  addCrop(crop) {
    const crops = this.getCrops();
    
    // Determine cropYear (Thai Buddhist Era, e.g. 2569)
    const plantDateObj = crop.plantDate ? new Date(crop.plantDate) : new Date();
    const cropYear = parseInt(crop.cropYear) || (plantDateObj.getFullYear() + 543);
    const cropCycle = parseInt(crop.cropCycle) || 1;
    const yearSuffix = String(cropYear).slice(-2); // e.g. '69' from 2569

    // STRICT VALIDATION: In 1 round (cropYear + cropCycle), 1 plot can only have 1 crop record!
    const existing = crops.find(c => 
      c.plotId === crop.plotId && 
      Number(c.cropYear) === Number(cropYear) && 
      Number(c.cropCycle || 1) === Number(cropCycle)
    );
    if (existing) {
      throw new Error(`แปลง ${crop.plotId} มีรอบเพาะปลูกในรอบนี้แล้ว (1 รอบบันทึกได้ 1 แปลงเท่านั้น ระบบล็อกห้ามทำซ้ำ)`);
    }

    // No running number needed as we format ID as: Year/PlotID/Cycle
    const newId = `${cropYear}/${crop.plotId}/${cropCycle}`;
    
    let estHarvest = crop.harvestDateEst;
    if (!estHarvest && crop.plantDate) {
      const pDate = new Date(crop.plantDate);
      pDate.setDate(pDate.getDate() + 90);
      estHarvest = pDate.toISOString().split('T')[0];
    }

    const newCrop = {
      ...crop,
      id: newId,
      cost: parseFloat(crop.cost) || 0,
      yield: crop.yield ? parseFloat(crop.yield) : null,
      status: crop.status || 'growing',
      harvestDateEst: estHarvest,
      cropYear: cropYear,
      cropCycle: cropCycle,
      fertilizingLog: crop.fertilizingLog || [],
      isProcessed: false
    };
    
    if (supabaseClient) {
      this.cropsCache.push(newCrop);
      const dbCrop = {
        id: newCrop.id,
        plot_id: newCrop.plotId,
        plant_date: newCrop.plantDate,
        cost: newCrop.cost,
        crop_year: newCrop.cropYear,
        harvest_date_est: newCrop.harvestDateEst,
        harvest_date_actual: newCrop.harvestDateActual || null,
        yield: newCrop.yield,
        status: newCrop.status,
        fertilizing_log: newCrop.fertilizingLog,
        is_processed: newCrop.isProcessed
      };
      supabaseClient.from('crops').insert([dbCrop]).then(({ error }) => {
        if (error) {
          console.error("Supabase addCrop error:", error);
          showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
        }
      });
    } else {
      crops.push(newCrop);
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
    }
    return newCrop;
  }

  updateCrop(id, updatedData) {
    let crops = this.getCrops();
    const index = crops.findIndex(c => c.id === id);
    if (index !== -1) {
      const updatedCrop = { 
        ...crops[index], 
        ...updatedData,
        cost: parseFloat(updatedData.cost) || 0,
        yield: updatedData.yield ? parseFloat(updatedData.yield) : crops[index].yield
      };

      if (supabaseClient) {
        this.cropsCache[index] = updatedCrop;
        const dbCropUpdate = {
          plot_id: updatedCrop.plotId,
          plant_date: updatedCrop.plantDate,
          cost: updatedCrop.cost,
          crop_year: updatedCrop.cropYear,
          harvest_date_est: updatedCrop.harvestDateEst,
          harvest_date_actual: updatedCrop.harvestDateActual || null,
          yield: updatedCrop.yield,
          status: updatedCrop.status,
          fertilizing_log: updatedCrop.fertilizingLog,
          is_processed: updatedCrop.isProcessed
        };
        supabaseClient.from('crops').update(dbCropUpdate).eq('id', id).then(({ error }) => {
          if (error) {
            console.error("Supabase updateCrop error:", error);
            showToast("ล้มเหลวในการอัปเดตออนไลน์: " + error.message, "error");
          }
        });
      } else {
        crops[index] = updatedCrop;
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      }
      return updatedCrop;
    }
    return null;
  }

  addFertilizerLog(cropId, logEntry) {
    let crops = this.getCrops();
    const index = crops.findIndex(c => c.id === cropId);
    if (index !== -1) {
      const log = crops[index].fertilizingLog || [];
      const newEntry = {
        date: logEntry.date || new Date().toISOString().split('T')[0],
        type: logEntry.type,
        amount: logEntry.amount,
        cost: parseFloat(logEntry.cost) || 0
      };
      log.push(newEntry);
      
      const updatedCrop = { ...crops[index], fertilizingLog: log };
      
      if (supabaseClient) {
        this.cropsCache[index] = updatedCrop;
        supabaseClient.from('crops').update({ fertilizing_log: log }).eq('id', cropId).then(({ error }) => {
          if (error) {
            console.error("Supabase addFertilizerLog error:", error);
            showToast("ล้มเหลวในการบันทึกออนไลน์: " + error.message, "error");
          }
        });
      } else {
        crops[index] = updatedCrop;
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      }
      return updatedCrop;
    }
    return null;
  }

  deleteCrop(id) {
    const crops = this.getCrops();
    if (supabaseClient) {
      this.cropsCache = this.cropsCache.filter(c => c.id !== id);
      this.inventoryCache = this.inventoryCache.filter(inv => inv.cropId !== id);
      this.salesCache = this.salesCache.filter(s => s.cropId !== id);
      
      supabaseClient.from('crops').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error("Supabase deleteCrop error:", error);
          showToast("ล้มเหลวในการลบออนไลน์: " + error.message, "error");
        }
      });
    } else {
      const filtered = crops.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(filtered));

      // Also delete inventory associated with it
      let inventory = this.getInventory();
      inventory = inventory.filter(inv => inv.cropId !== id);
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));

      // Also delete sales associated with it
      let sales = this.getSales();
      sales = sales.filter(s => s.cropId !== id);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    }

    return true;
  }

  // --- Inventory Methods (Phase 2) ---
  getInventory() {
    if (supabaseClient) {
      return this.inventoryCache;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY)) || [];
  }

  getInventoryByCropId(cropId) {
    return this.getInventory().find(inv => inv.cropId === cropId);
  }

  // --- Sales Methods (Phase 2) ---
  getSales() {
    if (supabaseClient) {
      return this.salesCache;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [];
  }

  getSalesByCropId(cropId) {
    return this.getSales().filter(s => s.cropId === cropId);
  }

  /**
   * Process fresh harvested flowers into dry herb stock
   * Allows optional custom dryWeightKg input, or defaults to calculated ratio (Chrysanthemum 8:1, Chamomile 6:1)
   */
  processDryHerbStock(cropId, freshYieldKg, customDryWeightKg = null, dryingDate = null) {
    const crop = this.getCropById(cropId);
    if (!crop) throw new Error('ไม่พบรหัสรอบการปลูกนี้ในระบบ');
    if (crop.isProcessed) throw new Error('ล็อตเพาะปลูกนี้ผ่านกระบวนการแปรรูปอบแห้งแล้ว');

    const plot = this.getPlotById(crop.plotId);
    const herbType = crop.seedlingSource || (plot ? plot.plantType : 'เก๊กฮวย') || 'เก๊กฮวย';

    const yieldAmount = parseFloat(freshYieldKg) || crop.yield || 0;
    if (yieldAmount <= 0) throw new Error('น้ำหนักผลผลิตสดต้องมากกว่า 0 กิโลกรัมเพื่อเข้าอบแห้ง');

    // Calculate dried yield or use custom dry weight
    // อัตราส่วนมาตรฐาน 10:1 (สด 10 กก. ได้แห้ง 1 กก. เช่น สด 150 kg -> แห้ง 15 kg)
    let finalDryWeight = 0;
    if (customDryWeightKg !== null && !isNaN(parseFloat(customDryWeightKg)) && parseFloat(customDryWeightKg) > 0) {
      finalDryWeight = parseFloat(parseFloat(customDryWeightKg).toFixed(2));
    } else {
      let ratio = 10;
      finalDryWeight = parseFloat((yieldAmount / ratio).toFixed(2));
    }

    const actualDryingDate = dryingDate || new Date().toISOString().split('T')[0];
    const batchId = 'DRY-' + Date.now().toString().slice(-4);

    // 1. Add to Inventory
    const inventory = this.getInventory();
    const existingIndex = inventory.findIndex(inv => inv.cropId === cropId);
    let invItem;
    if (existingIndex !== -1) {
      inventory[existingIndex].dryStockKg = parseFloat((inventory[existingIndex].dryStockKg + finalDryWeight).toFixed(2));
      inventory[existingIndex].processedDate = actualDryingDate;
      invItem = inventory[existingIndex];
      if (supabaseClient) {
        supabaseClient.from('inventory').update({ dry_stock_kg: invItem.dryStockKg }).eq('crop_id', cropId).then(({ error }) => {
          if (error) console.error("Supabase inventory update error:", error);
        });
      }
    } else {
      invItem = {
        cropId: cropId,
        herbType: herbType,
        dryStockKg: finalDryWeight,
        processedDate: actualDryingDate
      };
      inventory.push(invItem);
      if (supabaseClient) {
        supabaseClient.from('inventory').insert([{
          crop_id: invItem.cropId,
          herb_type: invItem.herbType,
          dry_stock_kg: invItem.dryStockKg,
          processed_date: invItem.processedDate
        }]).then(({ error }) => {
          if (error) console.error("Supabase inventory insert error:", error);
        });
      }
    }
    if (!supabaseClient) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // 2. Mark Crop as processed and save yield, drying date, and dry weight
    this.updateCrop(cropId, { 
      status: 'harvested',
      yield: yieldAmount,
      harvestDateActual: crop.harvestDateActual || actualDryingDate,
      isProcessed: true,
      dryingDate: actualDryingDate,
      freshUsed: yieldAmount,
      dryWeight: finalDryWeight
    });

    // 3. Add to batch history
    this.addDryingBatch({
      id: batchId,
      herbType: herbType,
      totalFreshAvailableKg: yieldAmount,
      freshWeightKg: yieldAmount,
      dryWeightKg: finalDryWeight,
      ratioActual: (yieldAmount / (finalDryWeight || 1)).toFixed(2),
      processedDate: actualDryingDate,
      note: `อบแห้งแปลง ${plot ? plot.name : cropId}`,
      cropIds: [cropId]
    });

    return finalDryWeight;
  }

  /**
   * Get all enterprise drying batch logs
   */
  getDryingBatches() {
    const data = localStorage.getItem(STORAGE_KEYS.DRYING_BATCHES);
    let list = [];
    if (!data) {
      list = [...MOCK_DRYING_BATCHES];
      localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(list));
    } else {
      try {
        list = JSON.parse(data);
      } catch (e) {
        list = [...MOCK_DRYING_BATCHES];
      }
    }
    let hasUpdated = false;
    list.forEach(b => {
      const fresh = parseFloat(b.freshWeightKg) || 0;
      const dry = parseFloat(b.dryWeightKg) || 0;
      if (fresh > 0 && dry > 0) {
        const calculatedRatio = (fresh / dry).toFixed(2);
        if (b.ratioActual !== calculatedRatio) {
          b.ratioActual = calculatedRatio;
          hasUpdated = true;
        }
      }
    });
    if (hasUpdated) {
      localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(list));
    }
    return list.sort((a, b) => new Date(b.processedDate) - new Date(a.processedDate));
  }

  /**
   * Add a drying batch log
   */
  addDryingBatch(batch) {
    const batches = this.getDryingBatches();
    batches.unshift(batch);
    localStorage.setItem(STORAGE_KEYS.DRYING_BATCHES, JSON.stringify(batches));
    return batch;
  }

  /**
   * Process pooled fresh flowers of a specific herb type into dry herb stock
   * Gathers fresh harvest from all plots of this herb without plot/member division
   */
  processPooledHerbDrying(herbType, freshWeightKg, customDryWeightKg = null, batchNote = '', processedDate = null) {
    const allCrops = this.getCrops();
    const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
    const targetHerb = isChrys ? 'เก๊กฮวย' : (herbType.includes('คาโมมายล์') ? 'คาโมมายล์' : herbType);
    
    // Find all harvested unprocessed crops of this herb type
    const pendingCrops = allCrops.filter(c => {
      if (c.status !== 'harvested' || c.isProcessed) return false;
      const plot = this.getPlotById(c.plotId);
      const cHerb = c.seedlingSource || (plot ? plot.plantType : '') || '';
      return cHerb.includes(targetHerb);
    });

    const totalPendingWeight = pendingCrops.reduce((sum, c) => sum + (parseFloat(c.yield) || 0), 0);
    if (totalPendingWeight <= 0) {
      throw new Error(`ไม่พบผลผลิตดอกสดรออบของพืช '${targetHerb}' ในระบบ`);
    }

    const weightToProcess = Math.min(parseFloat(freshWeightKg) || totalPendingWeight, totalPendingWeight);
    if (weightToProcess <= 0) {
      throw new Error('กรุณาระบุน้ำหนักผลผลิตสดที่ต้องการนำเข้าอบ');
    }

    // Determine ratio and final dry weight (สูตรมาตรฐานวิสาหกิจ 10:1 เช่น สด 150 kg -> แห้ง 15 kg)
    let ratio = 10;

    let finalDryWeight = 0;
    if (customDryWeightKg !== null && !isNaN(parseFloat(customDryWeightKg)) && parseFloat(customDryWeightKg) > 0) {
      finalDryWeight = parseFloat(parseFloat(customDryWeightKg).toFixed(2));
    } else {
      finalDryWeight = parseFloat((weightToProcess / ratio).toFixed(2));
    }

    const actualDate = processedDate || new Date().toISOString().split('T')[0];
    const batchId = 'DRY-' + Date.now().toString().slice(-4);

    // 1. Mark pending crops as processed and record drying info
    let remainingFresh = weightToProcess;
    const processedCropIds = [];
    const actualRatio = weightToProcess / (finalDryWeight || 1);

    for (const crop of pendingCrops) {
      const cYield = parseFloat(crop.yield) || 0;
      if (remainingFresh >= cYield - 0.05) {
        const cropDryWeight = parseFloat((cYield / actualRatio).toFixed(2));
        this.updateCrop(crop.id, { 
          isProcessed: true,
          dryingDate: actualDate,
          dryWeight: cropDryWeight,
          freshUsed: cYield
        });
        processedCropIds.push(crop.id);
        remainingFresh -= cYield;
      } else if (remainingFresh > 0) {
        const cropDryWeight = parseFloat((remainingFresh / actualRatio).toFixed(2));
        this.updateCrop(crop.id, { 
          isProcessed: true,
          dryingDate: actualDate,
          dryWeight: cropDryWeight,
          freshUsed: remainingFresh
        });
        processedCropIds.push(crop.id);
        remainingFresh = 0;
      }
    }

    // 2. Add dry herb stock to inventory
    const inventory = this.getInventory();
    const existingIndex = inventory.findIndex(inv => inv.isPooledBatch && inv.herbType === targetHerb);
    
    if (existingIndex !== -1) {
      inventory[existingIndex].dryStockKg = parseFloat((inventory[existingIndex].dryStockKg + finalDryWeight).toFixed(2));
      inventory[existingIndex].processedDate = actualDate;
    } else {
      inventory.push({
        cropId: batchId,
        herbType: targetHerb,
        dryStockKg: finalDryWeight,
        processedDate: actualDate,
        isPooledBatch: true,
        note: batchNote || `ผลผลิตรวมวิสาหกิจ (ทุกแปลงสมาชิก) - รอบอบ ${actualDate}`
      });
    }

    if (!supabaseClient) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // Also sync to products catalog (PRD-XXX)
    try {
      const products = this.getProducts();
      const matchPrd = products.find(p => p.unit === 'กก.' && p.name.includes(targetHerb));
      if (matchPrd) {
        this.updateProduct(matchPrd.id, { stock: parseFloat((matchPrd.stock + finalDryWeight).toFixed(2)) });
      }
    } catch (e) {
      console.error("Sync product error:", e);
    }

    // 3. Record batch drying log
    const dryingBatch = {
      id: batchId,
      herbType: targetHerb,
      totalFreshAvailableKg: totalPendingWeight,
      freshWeightKg: weightToProcess,
      dryWeightKg: finalDryWeight,
      ratioActual: (weightToProcess / (finalDryWeight || 1)).toFixed(2),
      processedDate: actualDate,
      note: batchNote || `ผลผลิตสดรวมทุกแปลงสมาชิก - อบแห้งเข้าคลัง`,
      cropIds: processedCropIds
    };
    this.addDryingBatch(dryingBatch);

    return dryingBatch;
  }

  /**
   * Get all enterprise packaging/canning batch logs
   */
  getPackagingBatches() {
    const data = localStorage.getItem(STORAGE_KEYS.PACKAGING_BATCHES);
    let list = [];
    if (!data) {
      list = [...MOCK_PACKAGING_BATCHES];
      localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(list));
    } else {
      try {
        list = JSON.parse(data);
        // Normalize packaging batches to 50 G
        let changed = false;
        list.forEach(b => {
          if (!b.packageSize || b.packageSize.includes('กิโลกรัม') || b.packageSize.includes('50 กรัม')) {
            b.packageSize = '50 G';
            if (b.dryUsedKg >= 50 && b.jarsProduced === 1) {
              b.dryUsedKg = 5.0;
              b.jarsProduced = 100;
            }
            if (b.productName) {
              b.productName = b.productName.replace(/50\s*กก\./g, '50 G').replace(/50\s*กิโลกรัม/g, '50 G').replace(/50\s*กรัม/g, '50 G').replace('กระป๋อง', 'กระป๋อง');
            }
            if (b.note) {
              b.note = b.note.replace(/50\s*กก\./g, '50 G').replace(/50\s*กิโลกรัม/g, '50 G');
            }
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(list));
        }
      } catch (e) {
        list = [...MOCK_PACKAGING_BATCHES];
      }
    }
    return list.sort((a, b) => new Date(b.processedDate) - new Date(a.processedDate));
  }

  /**
   * Add a packaging batch log
   */
  addPackagingBatch(batch) {
    const batches = this.getPackagingBatches();
    batches.unshift(batch);
    localStorage.setItem(STORAGE_KEYS.PACKAGING_BATCHES, JSON.stringify(batches));
    return batch;
  }

  /**
   * Process dry herb into canned/jar packaging products
   * (ดอกแห้ง > แบบกระป๋อง: สูตร 50 G ต่อ 1 กระป๋อง, 1 กก. = 20 กระป๋อง)
   */
  processHerbCanning(herbType, dryUsedKg, packageSizeUnit = '50 G', jarsCount = null, operatorName = '', note = '', processedDate = null) {
    const isChrys = herbType === 'เก๊กฮวย' || herbType.includes('เก๊กฮวย');
    const targetHerb = isChrys ? 'เก๊กฮวย' : (herbType.includes('คาโมมายล์') ? 'คาโมมายล์' : herbType);
    const usedKg = parseFloat(dryUsedKg) || 0;
    
    // Parse package size in grams (e.g. 50 G per jar = 0.05 kg)
    let szG = 50;
    if (typeof packageSizeUnit === 'number') {
      szG = packageSizeUnit;
    } else if (typeof packageSizeUnit === 'string') {
      const match = packageSizeUnit.match(/\d+/);
      szG = match ? parseInt(match[0]) : 50;
    }

    const jarsProduced = jarsCount ? parseInt(jarsCount) : Math.max(1, Math.floor((usedKg * 1000) / szG));
    const actualDate = processedDate || new Date().toISOString().split('T')[0];

    const yearBE = new Date(actualDate).getFullYear() + 543;
    const yearShort = String(yearBE).slice(-2);
    const existingBatches = this.getPackagingBatches();
    const batchId = `PACK-${yearShort}${String(existingBatches.length + 1).padStart(2, '0')}`;

    // 1. Deduct dry herbs used from inventory & bulk dry product stock (PRD-001/PRD-002)
    try {
      const inventory = this.getInventory();
      const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
      if (invItem && invItem.dryStockKg >= usedKg) {
        invItem.dryStockKg = Math.max(0, parseFloat((invItem.dryStockKg - usedKg).toFixed(2)));
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      }

      const bulkProd = products.find(p => p.unit === 'กก.' && (p.name.includes(targetHerb) || p.category.includes(targetHerb)));
      if (bulkProd && bulkProd.stock >= usedKg) {
        this.updateProduct(bulkProd.id, { stock: Math.max(0, parseFloat((bulkProd.stock - usedKg).toFixed(2))) });
      }
    } catch (e) {
      console.error("Canning deduction error:", e);
    }

    // 2. Find canned product in products catalog and increase jar stock
    const products = this.getProducts();
    let cannedProduct = products.find(p => (p.unit === 'กระป๋อง' || p.unit === 'กระป๋อง') && (p.category.includes(targetHerb) || p.name.includes(targetHerb)));

    if (cannedProduct) {
      this.updateProduct(cannedProduct.id, {
        stock: (cannedProduct.stock || 0) + jarsProduced,
        updatedDate: actualDate
      });
    }

    // 2. Record packaging batch log
    const batch = {
      id: batchId,
      herbType: targetHerb,
      dryUsedKg: usedKg,
      packageSize: `${szG} G`,
      jarsProduced: jarsProduced,
      processedDate: actualDate,
      productId: cannedProduct ? cannedProduct.id : '',
      productName: cannedProduct ? cannedProduct.name : `ดอก${targetHerb}กระป๋อง (${szG} G)`,
      operatorName: operatorName || 'สมาชิกกลุ่มแปรรูป',
      note: note || `บรรจุกระป๋องขนาด ${szG} G (1 กก. = ${Math.floor(1000 / szG)} กป.) ตามเกณฑ์วิสาหกิจ`
    };

    this.addPackagingBatch(batch);
    return batch;
  }

  /**
   * Record a sale of dry herbs from a specific Crop lot.
   * Decrements stock and logs transaction.
   */
  recordSale(cropId, amount, price, customer, date, saleType = 'bulk', customerId = null) {
    const amt = parseFloat(amount) || 0;
    const prc = parseFloat(price) || 0;
    if (amt <= 0) throw new Error(saleType === 'bulk' ? 'ปริมาณสมุนไพรอบแห้งที่ขายต้องมากกว่า 0 กก.' : 'จำนวนกระป๋องที่ขายต้องมากกว่า 0 กระป๋อง');
    if (prc <= 0) throw new Error('ราคาต่อหน่วยต้องมากกว่า 0 บาท');

    // 1. Check Inventory
    const inventory = this.getInventory();
    const invIndex = inventory.findIndex(inv => inv.cropId === cropId);
    if (invIndex === -1) throw new Error('ไม่พบล็อตสินค้านี้ในคลังสินค้า');
    
    const inv = inventory[invIndex];
    const jarCapacity = 0.05; // 50g per jar (0.05 kg) as requested (50 G ต่อ 1 กระป๋อง)

    let weightToDeduct = amt;
    if (saleType === 'jar') {
      weightToDeduct = parseFloat((amt * jarCapacity).toFixed(2));
    }

    if (inv.dryStockKg < weightToDeduct) {
      if (saleType === 'bulk') {
        throw new Error(`จำนวนสินค้าล็อตนี้ไม่เพียงพอในคลัง (คงเหลือ ${inv.dryStockKg} กก., ต้องการขาย ${amt} กก.)`);
      } else {
        const maxJarsAvailable = Math.floor(inv.dryStockKg / jarCapacity);
        throw new Error(`วัตถุดิบอบแห้งในคลังไม่เพียงพอสำหรับบรรจุขาย (คงเหลือ ${inv.dryStockKg} กก., เทียบเท่าสูงสุด ${maxJarsAvailable} กระป๋อง, ต้องการขาย ${amt} กระป๋อง)`);
      }
    }

    inv.dryStockKg = parseFloat((inv.dryStockKg - weightToDeduct).toFixed(2));
    if (supabaseClient) {
      supabaseClient.from('inventory').update({ dry_stock_kg: inv.dryStockKg }).eq('crop_id', cropId).then(({ error }) => {
        if (error) console.error("Supabase inventory deduct error:", error);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // Log sale transaction
    const sales = this.getSales();
    const maxIdNum = sales.reduce((max, s) => {
      const num = parseInt(s.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newSaleId = `SALE-${String(maxIdNum + 1).padStart(3, '0')}`;

    const newSale = {
      id: newSaleId,
      cropId,
      amount: amt,
      price: prc,
      amountKg: amt, // for legacy code compatibility
      pricePerKg: prc, // for legacy code compatibility
      totalPrice: parseFloat((amt * prc).toFixed(2)),
      customerId: customerId || null,
      customer: customer || 'ทั่วไป/ไม่ระบุชื่อ',
      date: date || new Date().toISOString().split('T')[0],
      saleType // 'bulk' or 'jar'
    };
    
    if (supabaseClient) {
      this.salesCache.push(newSale);
      const dbSale = {
        id: newSale.id,
        crop_id: newSale.cropId,
        amount: newSale.amount,
        price: newSale.price,
        amount_kg: newSale.amountKg,
        price_per_kg: newSale.pricePerKg,
        total_price: newSale.totalPrice,
        customer: newSale.customer,
        date: newSale.date,
        sale_type: newSale.saleType
      };
      supabaseClient.from('sales').insert([dbSale]).then(({ error }) => {
        if (error) {
          console.error("Supabase recordSale error:", error);
          showToast("ล้มเหลวในการบันทึกประวัติการขายออนไลน์: " + error.message, "error");
        }
      });
    } else {
      sales.push(newSale);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    }

    return newSale;
  }

  deleteSale(saleId, restoreStock = true) {
    let sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) throw new Error('ไม่พบรายการขายนี้ในระบบ');

    // 1. Optionally restore stock back into the crop lot
    if (restoreStock) {
      let inventory = this.getInventory();
      const invIndex = inventory.findIndex(inv => inv.cropId === sale.cropId);
      if (invIndex !== -1) {
        const inv = inventory[invIndex];
        const jarCapacity = 0.05; // 50g per jar
        const weightToRestore = sale.saleType === 'jar'
          ? parseFloat((sale.amount * jarCapacity).toFixed(2))
          : (parseFloat(sale.amount) || parseFloat(sale.amountKg) || 0);

        inv.dryStockKg = parseFloat((inv.dryStockKg + weightToRestore).toFixed(2));
        if (supabaseClient) {
          supabaseClient.from('inventory').update({ dry_stock_kg: inv.dryStockKg }).eq('crop_id', sale.cropId).then(({ error }) => {
            if (error) console.error("Supabase restore inventory error:", error);
          });
        } else {
          localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
        }
      }

      // Restore product stock if linked to catalog (PRD-XXX)
      try {
        const products = this.getProducts();
        const prod = products.find(p => p.id === sale.cropId);
        if (prod) {
          const restoredQty = parseFloat(sale.amount) || parseFloat(sale.amountKg) || 0;
          this.updateProduct(prod.id, { stock: parseFloat((prod.stock + restoredQty).toFixed(2)) });
        }
      } catch (e) {
        console.error("Product stock restore error:", e);
      }
    }

    // 2. Remove sale from sales cache and storage
    if (supabaseClient) {
      this.salesCache = this.salesCache.filter(s => s.id !== saleId);
      supabaseClient.from('sales').delete().eq('id', saleId).then(({ error }) => {
        if (error) console.error("Supabase deleteSale error:", error);
      });
    } else {
      const filtered = sales.filter(s => s.id !== saleId);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filtered));
    }

    return true;
  }

  deleteSales(saleIds, restoreStock = true) {
    if (!Array.isArray(saleIds) || saleIds.length === 0) return 0;
    let successCount = 0;
    saleIds.forEach(id => {
      try {
        this.deleteSale(id, restoreStock);
        successCount++;
      } catch (e) {
        console.error(`Failed to delete sale ${id}:`, e);
      }
    });
    return successCount;
  }

  updateLotWeights(cropId, yieldFresh, dryStock) {
    const fresh = parseFloat(yieldFresh) || 0;
    const dry = parseFloat(dryStock) || 0;
    if (fresh < 0 || dry < 0) throw new Error('น้ำหนักดอกสดและอบแห้งต้องไม่ติดลบ');

    // 1. Update Inventory
    let inventory = this.getInventory();
    const invIndex = inventory.findIndex(inv => inv.cropId === cropId);
    if (invIndex === -1) throw new Error('ไม่พบล็อตสินค้านี้ในคลังสินค้า');
    inventory[invIndex].dryStockKg = dry;
    
    if (supabaseClient) {
      supabaseClient.from('inventory').update({ dry_stock_kg: dry }).eq('crop_id', cropId).then(({ error }) => {
        if (error) console.error("Supabase updateLotWeights inventory error:", error);
      });
    } else {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    }

    // 2. Update Crop record
    let crops = this.getCrops();
    const cropIndex = crops.findIndex(c => c.id === cropId);
    if (cropIndex !== -1) {
      crops[cropIndex].yield = fresh;
      if (supabaseClient) {
        supabaseClient.from('crops').update({ yield: fresh }).eq('id', cropId).then(({ error }) => {
          if (error) console.error("Supabase updateLotWeights crop error:", error);
        });
      } else {
        localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
      }
    }

    return { fresh, dry };
  }

  // --- Customer Methods ---
  getCustomers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) || [];
  }

  getCustomerById(id) {
    return this.getCustomers().find(c => c.id === id);
  }

  addCustomer(customerData) {
    const customers = this.getCustomers();
    const maxIdNum = customers.reduce((max, c) => {
      const parts = (c.id || '').split('-');
      const num = parseInt(parts[1]);
      return (!isNaN(num) && num > max) ? num : max;
    }, 0);
    const newId = `CUST-${String(maxIdNum + 1).padStart(3, '0')}`;

    const newCustomer = {
      id: newId,
      name: (customerData.name || '').trim(),
      customerType: customerData.customerType || 'ลูกค้าทั่วไป',
      phone: (customerData.phone || '').trim(),
      address: (customerData.address || '').trim(),
      lineId: (customerData.lineId || '').trim(),
      facebook: (customerData.facebook || '').trim(),
      contactChannel: (customerData.contactChannel || customerData.lineId || customerData.facebook || '').trim()
    };

    if (!newCustomer.name) throw new Error('กรุณาระบุชื่อลูกค้าหรือชื่อร้านค้า');

    customers.push(newCustomer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    return newCustomer;
  }

  updateCustomer(id, data) {
    let customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        name: (data.name !== undefined ? data.name : customers[index].name).trim(),
        customerType: data.customerType || customers[index].customerType,
        phone: (data.phone !== undefined ? data.phone : customers[index].phone).trim(),
        address: (data.address !== undefined ? data.address : customers[index].address).trim(),
        lineId: (data.lineId !== undefined ? data.lineId : (customers[index].lineId || '')).trim(),
        facebook: (data.facebook !== undefined ? data.facebook : (customers[index].facebook || '')).trim(),
        contactChannel: (data.contactChannel !== undefined ? data.contactChannel : (customers[index].contactChannel || '')).trim()
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      return customers[index];
    }
    throw new Error('ไม่พบข้อมูลลูกค้ารายนี้');
  }

  deleteCustomer(id) {
    let customers = this.getCustomers();
    const sales = this.getSales();
    const hasSales = sales.some(s => s.customerId === id);
    if (hasSales) {
      throw new Error('ไม่สามารถลบลูกค้ารายนี้ได้ เนื่องจากมีประวัติการจำหน่ายสินค้าผูกอยู่');
    }

    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
    return true;
  }

  /**
   * Generates a complete financial statement per member (Cost, Sales, Net Profit)
   */
  getFinancialReport() {
    const members = this.getMembers();
    const plots = this.getPlots();
    const crops = this.getCrops();
    const sales = this.getSales();

    return members.map(m => {
      // Find plots owned by this member
      const memberPlots = plots.filter(p => p.memberIds && p.memberIds.includes(m.id));
      const plotIds = memberPlots.map(p => p.id);

      // Find crops on those plots
      const memberCrops = crops.filter(c => plotIds.includes(c.plotId));
      const cropIds = memberCrops.map(c => c.id);

      // Total Cost = Sum of crop season costs (initial cost + fertilizing/maintenance logs cost)
      const totalCost = memberCrops.reduce((sum, c) => {
        const initialCost = parseFloat(c.cost) || 0;
        const fertCost = (c.fertilizingLog || []).reduce((s, f) => s + (parseFloat(f.cost) || 0), 0);
        return sum + initialCost + fertCost;
      }, 0);

      // Total Revenue = Sum of sales of this member's crop lots
      const memberSales = sales.filter(s => cropIds.includes(s.cropId));
      const totalRevenue = memberSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

      const netProfit = totalRevenue - totalCost;

      return {
        id: m.id,
        name: m.name,
        role: m.role,
        villageNumber: m.villageNumber,
        totalPlots: memberPlots.length,
        totalCrops: memberCrops.length,
        totalCost,
        totalRevenue,
        netProfit,
        status: netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'breakeven'
      };
    });
  }

  // --- Products Catalog Methods (PRD-XXX) ---
  getProducts() {
    try {
      const MIGRATION_KEY = 'herb_enterprise_products_price_v6';
      const migrated = localStorage.getItem(MIGRATION_KEY);
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
        localStorage.setItem(MIGRATION_KEY, 'done');
        return [...MOCK_PRODUCTS];
      }
      let products = JSON.parse(data) || [];
      
      // AUTO-MIGRATE: Clean up old units based on strict criteria (กก. and กระป๋อง only)
      let needsSave = false;
      products.forEach(p => {
        if (p.unit === 'กระปุก' || p.unit === 'ซอง' || p.unit === 'กล่อง' || p.unit === 'ขวด' || p.unit === 'custom') {
          p.unit = 'กระป๋อง';
          needsSave = true;
        }
      });
      if (needsSave) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      }

      // Auto-migrate to v6: เก๊กฮวยกระป๋อง 50G 150, คาโมมายด์กระป๋อง 50 G 100...
      if (!migrated) {
        const defaultPriceMap = {
          'PRD-001': { price: 250, name: 'ดอกเก๊กฮวยอบแห้ง (1 กก.)', unit: 'กก.' },
          'PRD-002': { price: 450, name: 'ดอกคาโมมายล์อบแห้ง (1 กก.)', unit: 'กก.' },
          'PRD-003': { price: 150, name: 'เก๊กฮวยกระป๋อง (50 G)', unit: 'กระป๋อง' },
          'PRD-004': { price: 100, name: 'คาโมมายล์กระป๋อง (50 G)', unit: 'กระป๋อง' }
        };

        products = products.map(p => {
          if (defaultPriceMap[p.id]) {
            return {
              ...p,
              name: defaultPriceMap[p.id].name,
              price: defaultPriceMap[p.id].price,
              unit: defaultPriceMap[p.id].unit
            };
          }
          return p;
        });

        // Add any missing mock products (incl. PRD-006/PRD-007)
        for (const mockItem of MOCK_PRODUCTS) {
          if (!products.some(p => p.id === mockItem.id)) {
            products.push(mockItem);
          }
        }

        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
        localStorage.setItem(MIGRATION_KEY, 'done');
      }

      return products;
    } catch (e) {
      return [...MOCK_PRODUCTS];
    }
  }

  /**
   * Helper to get current product price by herb type and unit
   * e.g. getProductPrice('เก๊กฮวย', 'กก.') -> 250
   * e.g. getProductPrice('คาโมมายล์', 'กก.') -> 450
   * e.g. getProductPrice('เก๊กฮวย', 'กระป๋อง') -> 150 (50 G)
   * e.g. getProductPrice('คาโมมายล์', 'กระป๋อง') -> 100 (50 G)
   */
  getProductPrice(herbType = '', unit = 'กก.') {
    const products = this.getProducts();
    const isChrys = herbType.includes('เก๊กฮวย');
    const isCham = herbType.includes('คาโมมายล์');
    
    const found = products.find(p => {
      const matchUnit = unit === 'กก.' ? (p.unit === 'กก.' || p.unit === 'kg') : (p.unit === 'กระป๋อง' || p.unit === 'กระป๋อง');
      if (!matchUnit) return false;
      if (isChrys && (p.name.includes('เก๊กฮวย') || p.category.includes('เก๊กฮวย'))) return true;
      if (isCham && (p.name.includes('คาโมมายล์') || p.category.includes('คาโมมายล์'))) return true;
      return p.name.includes(herbType);
    });

    if (found) return found.price;

    // Standard Fallbacks: เก๊กฮวยกระป๋อง 50G=150, คาโมมายด์กระป๋อง 50G=100, เก๊กฮวยอบแห้ง 1KG=250, คาโมมายด์อบแห้ง 1KG=450
    if (isChrys) return unit === 'กก.' ? 250 : 150;
    if (isCham) return unit === 'กก.' ? 450 : 100;
    return unit === 'กก.' ? 300 : 120;
  }

  /**
   * Helper to quickly update product price
   */
  updateProductPrice(productId, newPrice) {
    const priceVal = parseFloat(newPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      throw new Error('ราคาต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0 บาท');
    }
    return this.updateProduct(productId, { price: priceVal });
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  addProduct(productData) {
    const products = this.getProducts();
    let newId = productData.id ? productData.id.trim() : '';
    if (!newId) {
      const maxIdNum = products.reduce((max, p) => {
        const parts = (p.id || '').split('-');
        const num = parseInt(parts[1]);
        return (!isNaN(num) && num > max) ? num : max;
      }, 0);
      newId = `PRD-${String(maxIdNum + 1).padStart(3, '0')}`;
    }

    if (products.some(p => p.id === newId)) {
      throw new Error(`รหัสสินค้า '${newId}' มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
    }

    const newProduct = {
      id: newId,
      name: (productData.name || '').trim(),
      price: parseFloat(productData.price) || 0,
      unit: (productData.unit || 'กก.').trim(),
      stock: parseFloat(productData.stock) || 0,
      category: (productData.category || 'ทั่วไป').trim(),
      updatedDate: productData.updatedDate || new Date().toISOString().split('T')[0]
    };

    if (!newProduct.name) throw new Error('กรุณาระบุชื่อสินค้า');
    if (newProduct.price < 0) throw new Error('ราคาต่อหน่วยต้องไม่ติดลบ');
    if (newProduct.stock < 0) throw new Error('จำนวนสต็อกเริ่มต้นต้องไม่ติดลบ');

    products.push(newProduct);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  }

  updateProduct(id, productData) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error(`ไม่พบสินค้ารหัส ${id} ในระบบ`);

    products[index] = {
      ...products[index],
      name: productData.name !== undefined ? productData.name.trim() : products[index].name,
      price: productData.price !== undefined ? (parseFloat(productData.price) || 0) : products[index].price,
      unit: productData.unit !== undefined ? productData.unit.trim() : products[index].unit,
      stock: productData.stock !== undefined ? (parseFloat(productData.stock) || 0) : products[index].stock,
      category: productData.category !== undefined ? productData.category.trim() : products[index].category,
      updatedDate: new Date().toISOString().split('T')[0]
    };

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return products[index];
  }

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
    return true;
  }

  adjustProductStock(id, newStock, reason = '') {
    const stockVal = parseFloat(newStock);
    if (isNaN(stockVal) || stockVal < 0) throw new Error('จำนวนสต็อกต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
    return this.updateProduct(id, { stock: stockVal });
  }

  deductProductStock(id, amount, customerName = '', salePrice = null, date = null, customerId = null) {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) throw new Error('จำนวนที่ตัดสต็อกต้องมากกว่า 0');

    const product = this.getProductById(id);
    if (!product) throw new Error(`ไม่พบสินค้ารหัส ${id}`);
    if (product.stock < amt) {
      throw new Error(`สต็อกสินค้ามีไม่เพียงพอ (คงเหลือ ${product.stock} ${product.unit}, ต้องการตัด ${amt} ${product.unit})`);
    }

    const newStock = parseFloat((product.stock - amt).toFixed(2));
    this.updateProduct(id, { stock: newStock });

    // Also deduct bulk dry herb stock from inventory if sold in กก.
    if (product.unit === 'กก.' || product.unit === 'kg') {
      try {
        const inventory = this.getInventory();
        const targetHerb = product.name.includes('เก๊กฮวย') ? 'เก๊กฮวย' : (product.name.includes('คาโมมาย') ? 'คาโมมายล์' : '');
        if (targetHerb) {
          const invItem = inventory.find(i => (i.herbType && i.herbType.includes(targetHerb)));
          if (invItem) {
            invItem.dryStockKg = Math.max(0, parseFloat((invItem.dryStockKg - amt).toFixed(2)));
            localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
          }
        }
      } catch (e) {
        console.error("Inventory sync error in deductProductStock:", e);
      }
    }

    // Record sale transaction
    const unitPrice = salePrice !== null && !isNaN(parseFloat(salePrice)) ? parseFloat(salePrice) : product.price;
    const sales = this.getSales();
    const maxIdNum = sales.reduce((max, s) => {
      const num = parseInt(s.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    const newSaleId = `SALE-${String(maxIdNum + 1).padStart(3, '0')}`;
    const newSale = {
      id: newSaleId,
      cropId: id,
      amount: amt,
      price: unitPrice,
      amountKg: amt,
      pricePerKg: unitPrice,
      totalPrice: parseFloat((amt * unitPrice).toFixed(2)),
      customerId: customerId || null,
      customer: customerName || 'ทั่วไป/ไม่ระบุชื่อ',
      date: date || new Date().toISOString().split('T')[0],
      saleType: product.unit === 'กก.' ? 'bulk' : 'jar'
    };

    sales.push(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));

    return { product: this.getProductById(id), sale: newSale };
  }

  getStats() {
    const currentUser = this.getCurrentUser();
    const isMember = currentUser && currentUser.role === 'Member';

    const members = this.getMembers();
    let plots = this.getPlots();
    if (isMember) {
      plots = plots.filter(p => p.memberIds && p.memberIds.includes(currentUser.memberId));
    }
    const plotIds = plots.map(p => p.id);
    const crops = this.getCrops().filter(c => plotIds.includes(c.plotId));
    const cropIds = crops.map(c => c.id);
    const inventory = this.getInventory().filter(i => cropIds.includes(i.cropId));
    const sales = this.getSales().filter(s => cropIds.includes(s.cropId));

    const activeMembersCount = isMember ? 1 : members.filter(m => m.status === 'active').length;
    
    let totalSqMeters = 0;
    plots.forEach(p => {
      const r = p.sizeRai || 0;
      const n = p.sizeNgan || 0;
      const w = p.sizeSqWah || 0;
      totalSqMeters += (r * 1600) + (n * 400) + (w * 4);
    });

    const activeCrops = crops.filter(c => c.status === 'growing');
    const chrysanthemumPlots = plots.filter(p => p.plantType === 'เก๊กฮวย').length;
    const chamomilePlots = plots.filter(p => p.plantType === 'คาโมมายล์').length;

    // Total fresh yield collected
    const totalYield = crops.filter(c => c.status === 'harvested' && c.yield).reduce((sum, c) => sum + c.yield, 0);

    // Total processed dry herbs currently in stock
    const totalDryStock = inventory.reduce((sum, i) => sum + i.dryStockKg, 0);

    // Total sales revenue
    const totalSalesRev = sales.reduce((sum, s) => sum + s.totalPrice, 0);

    return {
      totalMembers: isMember ? 1 : members.length,
      activeMembers: activeMembersCount,
      totalPlots: plots.length,
      totalAreaSqM: totalSqMeters,
      totalAreaRai: (totalSqMeters / 1600).toFixed(2),
      activeCrops: activeCrops.length,
      chrysanthemumPlots,
      chamomilePlots,
      totalYield: totalYield.toFixed(1),
      totalDryStock: totalDryStock.toFixed(2),
      totalSalesRevenue: totalSalesRev
    };
  }

  // --- Planting Roadmap Methods ---
  getRoadmaps() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROADMAPS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
        return JSON.parse(JSON.stringify(DEFAULT_ROADMAPS));
      }
      return JSON.parse(data);
    } catch (e) {
      console.error("Error reading roadmaps:", e);
      return JSON.parse(JSON.stringify(DEFAULT_ROADMAPS));
    }
  }

  getRoadmapByHerb(herbName) {
    const roadmaps = this.getRoadmaps();
    if (roadmaps[herbName]) {
      return roadmaps[herbName];
    }
    const keys = Object.keys(roadmaps);
    if (keys.length > 0) {
      return roadmaps[keys[0]];
    }
    return DEFAULT_ROADMAPS['เก๊กฮวย'];
  }

  saveRoadmaps(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(data));
      return data;
    } catch (e) {
      console.error("Error saving roadmaps:", e);
      throw e;
    }
  }

  saveHerbRoadmap(herbName, roadmapData) {
    const roadmaps = this.getRoadmaps();
    roadmaps[herbName] = roadmapData;
    this.saveRoadmaps(roadmaps);
    return roadmapData;
  }

  saveHerbStep(herbName, stepData) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName]) {
      roadmaps[herbName] = {
        name: herbName,
        icon: '🌿',
        description: `แผนการปลูกสมุนไพร ${herbName}`,
        durationDays: 90,
        cycleText: 'ระยะเวลาเพาะปลูกรวมประมาณ 90 วัน',
        steps: []
      };
    }

    const steps = roadmaps[herbName].steps || [];
    const existingIndex = steps.findIndex(s => s.stepNo === Number(stepData.stepNo) || (stepData.originalStepNo && s.stepNo === Number(stepData.originalStepNo)));

    const formattedStep = {
      stepNo: Number(stepData.stepNo) || (steps.length + 1),
      title: stepData.title || 'ขั้นตอนใหม่',
      dayNumber: Number(stepData.dayNumber) || 1,
      dayLabel: stepData.dayLabel || `วันที่ ${stepData.dayNumber || 1}`,
      advice: stepData.advice || '',
      detail: stepData.detail || '',
      color: stepData.color || 'emerald',
      icon: stepData.icon || 'fa-seedling'
    };

    if (existingIndex >= 0) {
      steps[existingIndex] = formattedStep;
    } else {
      steps.push(formattedStep);
    }

    // Sort steps by dayNumber
    steps.sort((a, b) => a.dayNumber - b.dayNumber);
    // Re-index step numbers 1, 2, 3...
    steps.forEach((s, idx) => {
      s.stepNo = idx + 1;
    });

    roadmaps[herbName].steps = steps;
    // Update max duration if step day exceeds current
    const maxDay = Math.max(...steps.map(s => s.dayNumber), 1);
    roadmaps[herbName].durationDays = maxDay;
    roadmaps[herbName].cycleText = `ระยะเวลาเพาะปลูกรวมประมาณ ${maxDay} วัน`;

    this.saveRoadmaps(roadmaps);
    return roadmaps[herbName];
  }

  deleteHerbStep(herbName, stepNo) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName] || !roadmaps[herbName].steps) return false;

    roadmaps[herbName].steps = roadmaps[herbName].steps.filter(s => s.stepNo !== Number(stepNo));
    // Re-number
    roadmaps[herbName].steps.forEach((s, idx) => {
      s.stepNo = idx + 1;
    });

    const maxDay = roadmaps[herbName].steps.length > 0 ? Math.max(...roadmaps[herbName].steps.map(s => s.dayNumber)) : 0;
    roadmaps[herbName].durationDays = maxDay;
    roadmaps[herbName].cycleText = `ระยะเวลาเพาะปลูกรวมประมาณ ${maxDay} วัน`;

    this.saveRoadmaps(roadmaps);
    return roadmaps[herbName];
  }

  deleteHerbRoadmap(herbName) {
    const roadmaps = this.getRoadmaps();
    if (!roadmaps[herbName]) return false;
    delete roadmaps[herbName];
    if (Object.keys(roadmaps).length === 0) {
      this.saveRoadmaps(JSON.parse(JSON.stringify(DEFAULT_ROADMAPS)));
    } else {
      this.saveRoadmaps(roadmaps);
    }
    return true;
  }

  resetDefaultRoadmaps() {
    localStorage.setItem(STORAGE_KEYS.ROADMAPS, JSON.stringify(DEFAULT_ROADMAPS));
    return JSON.parse(JSON.stringify(DEFAULT_ROADMAPS));
  }
}
export const appState = new AppState();
