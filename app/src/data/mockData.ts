import type { TeamMember, Project, Task, Issue, FileVersion, GitNode } from '@/types';

// ============================================================
// 当前登录用户（模拟）
// ============================================================
export const currentUserId = 'm1';
export const currentUserRole: 'admin' | 'member' = 'member';

// ============================================================
// 团队成员（9人 + 2 Admin）
// ============================================================
export const teamMembers: TeamMember[] = [
  // -- Admin --
  {
    id: 'a1', name: '傅雪影', avatar: '/team-avatars.png',
    role: 'Admin', initials: 'FX', color: '#dc2626',
    userRole: 'admin', status: 'active', joinedAt: '2025-01-01',
    phone: '13800000001', password: 'fuxueying',
  },
  {
    id: 'a2', name: '赵海涛', avatar: '/team-avatars.png',
    role: 'Admin', initials: 'ZH', color: '#7c3aed',
    userRole: 'admin', status: 'active', joinedAt: '2025-01-01',
    phone: '13800000002', password: 'zhaohaitao',
  },
  // -- Members --
  {
    id: 'm1', name: '陈润峰', avatar: '/team-avatars.png',
    role: '硬件负责人', initials: 'CR', color: '#1868d6',
    userRole: 'member', status: 'active', joinedAt: '2026-03-01',
    phone: '13800000011', password: 'chenrunfeng',
  },
  {
    id: 'm2', name: '王一帆', avatar: '/team-avatars.png',
    role: '触觉研发', initials: 'WY', color: '#10b981',
    userRole: 'member', status: 'active', joinedAt: '2026-03-01',
    phone: '13800000012', password: 'wangyifan',
  },
  {
    id: 'm3', name: '薛炫豪', avatar: '/team-avatars.png',
    role: '算法工程师', initials: 'XX', color: '#d7244b',
    userRole: 'member', status: 'active', joinedAt: '2026-03-15',
    phone: '13800000013', password: 'xuexuanhao',
  },
  {
    id: 'm4', name: '武鸿旭', avatar: '/team-avatars.png',
    role: '工程师', initials: 'WH', color: '#f59e0b',
    userRole: 'member', status: 'active', joinedAt: '2026-04-01',
    phone: '13800000014', password: 'wuhongxu',
  },
  {
    id: 'm5', name: '肖文博', avatar: '/team-avatars.png',
    role: '机械臂训练', initials: 'XW', color: '#8b5cf6',
    userRole: 'member', status: 'active', joinedAt: '2026-03-01',
    phone: '13800000015', password: 'xiaowenbo',
  },
  {
    id: 'm6', name: '刘世文', avatar: '/team-avatars.png',
    role: '产品经理', initials: 'LS', color: '#06b6d4',
    userRole: 'member', status: 'active', joinedAt: '2026-03-01',
    phone: '13800000016', password: 'liushiwen',
  },
  {
    id: 'm7', name: '陈露佳', avatar: '/team-avatars.png',
    role: '算法工程师', initials: 'CL', color: '#e87940',
    userRole: 'member', status: 'active', joinedAt: '2026-04-15',
    phone: '13800000017', password: 'chenlujia',
  },
  {
    id: 'm8', name: '张柯', avatar: '/team-avatars.png',
    role: '算法工程师', initials: 'ZK', color: '#ec4899',
    userRole: 'member', status: 'active', joinedAt: '2026-04-01',
    phone: '13800000018', password: 'zhangke',
  },
  {
    id: 'm9', name: '伟森浩', avatar: '/team-avatars.png',
    role: '硬件工程师', initials: 'WS', color: '#14b8a6',
    userRole: 'member', status: 'active', joinedAt: '2026-04-01',
    phone: '13800000019', password: 'weisenhao',
  },

];
// 只返回 active 的成员
export const activeMembers = teamMembers.filter((m) => m.status === 'active');
export const adminMembers = teamMembers.filter((m) => m.userRole === 'admin');
export const regularMembers = activeMembers.filter((m) => m.userRole === 'member');

// ============================================================
// 项目
// ============================================================
export const projects: Project[] = [
  {
    id: 'w1', name: '本周任务看板', description: '@所有人 小组周任务分配',
    status: 'active', lead: teamMembers[2], members: [teamMembers[2], teamMembers[3], teamMembers[4], teamMembers[5], teamMembers[6], teamMembers[7], teamMembers[8], teamMembers[9], teamMembers[10]],
    startDate: '2026-07-06',
  },
  {
    id: 'p1', name: 'UMI 系列', description: 'UMI3D软硬件、夹爪数据交互、遥操作',
    status: 'active', lead: teamMembers[2], members: [teamMembers[2], teamMembers[4]],
    startDate: '2026-06-01',
    issues: ['UMI3D启动异常', '夹爪数据延迟'],
  },
  {
    id: 'p2', name: '触觉手套', description: '触觉手套软件定型、夹爪触觉方案',
    status: 'active', lead: teamMembers[3], members: [teamMembers[3]],
    startDate: '2026-06-01',
  },
  {
    id: 'p3', name: '传感器算法', description: 'sEMG/IMU精度、视频数据处理管线',
    status: 'active', lead: teamMembers[4], members: [teamMembers[4], teamMembers[8]],
    startDate: '2026-06-01',
    issues: ['sEMG噪声过大'],
  },
  {
    id: 'p4', name: '机械臂训练', description: 'REBOT/Piper训练、采集推理复现',
    status: 'active', lead: teamMembers[6], members: [teamMembers[6], teamMembers[9]],
    startDate: '2026-06-01',
  },
  {
    id: 'p5', name: 'EGO 设备', description: 'EGO交付、SLAM/深度算法优化',
    status: 'active', lead: teamMembers[2], members: [teamMembers[2], teamMembers[6], teamMembers[7]],
    startDate: '2026-06-01',
    issues: ['SLAM定位漂移'],
  },
  {
    id: 'p6', name: 'AlohaMini', description: 'AlohaMini机器人研究、语音交互',
    status: 'active', lead: teamMembers[7],
    members: [teamMembers[2], teamMembers[6], teamMembers[5], teamMembers[7], teamMembers[9]],
    startDate: '2026-06-01',
  },
  {
    id: 'p7', name: '产品交付', description: '品牌手册、用户文档、质量评估',
    status: 'active', lead: teamMembers[7], members: [teamMembers[7]],
    startDate: '2026-06-01',
  },
];

// ============================================================
// 任务（含 editors/viewers 权限列表）
// ============================================================
export const tasks: Task[] = [
  {
    id: 'wk1', projectId: 'w1', title: '所有产品交付',
    description: '', assignee: teamMembers[2], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk2', projectId: 'w1', title: '便捷的umi夹爪能否发送数据给机械臂',
    description: '', assignee: teamMembers[2], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk3', projectId: 'w1', title: 'rebot机械臂能否用umi遥操',
    description: '', assignee: teamMembers[2], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk4', projectId: 'w1', title: 'pi模型推理微调',
    description: '', assignee: teamMembers[2], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk5', projectId: 'w1', title: '双臂协作推理',
    description: '', assignee: teamMembers[2], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk6', projectId: 'w1', title: '触觉手套和软件定型',
    description: '', assignee: teamMembers[3], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk7', projectId: 'w1', title: '夹爪触觉方案研究',
    description: '', assignee: teamMembers[3], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk8', projectId: 'w1', title: 'ego管线建立',
    description: '', assignee: teamMembers[4], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk9', projectId: 'w1', title: 'pi模型推理微调',
    description: '', assignee: teamMembers[4], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk10', projectId: 'w1', title: 'rebot机械臂',
    description: '', assignee: teamMembers[4], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk11', projectId: 'w1', title: 'ego遥操作尝试',
    description: '', assignee: teamMembers[4], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk12', projectId: 'w1', title: '双臂协作推理',
    description: '', assignee: teamMembers[4], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk13', projectId: 'w1', title: '新的双目模组搭建',
    description: '', assignee: teamMembers[5], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk14', projectId: 'w1', title: '亚博x5测试',
    description: '', assignee: teamMembers[5], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk15', projectId: 'w1', title: '寻找更合适的ego方案不丢帧的自己能组摄像头和板子',
    description: '', assignee: teamMembers[5], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk16', projectId: 'w1', title: '课程设计实训课资料整理修改',
    description: '', assignee: teamMembers[6], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk17', projectId: 'w1', title: '所有产品外观确定',
    description: '', assignee: teamMembers[6], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk18', projectId: 'w1', title: 'ego设备slam算法和深度算法精度评估',
    description: '', assignee: teamMembers[6], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk19', projectId: 'w1', title: '和武一起找更好的ego设备方案',
    description: '', assignee: teamMembers[6], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk20', projectId: 'w1', title: 'imu比较选型看是否需要更换',
    description: '', assignee: teamMembers[6], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk21', projectId: 'w1', title: 'alohamini机器人研究以及先做语音交互模型训练',
    description: '', assignee: teamMembers[2], editors: ['m1', 'm3', 'm4', 'm5'], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk22', projectId: 'w1', title: '所有产品的品牌参数手册完成',
    description: '', assignee: teamMembers[7], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk23', projectId: 'w1', title: '用户文档完成',
    description: '', assignee: teamMembers[7], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk24', projectId: 'w1', title: '质量评估完成',
    description: '', assignee: teamMembers[7], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk25', projectId: 'w1', title: '代码管理完成',
    description: '', assignee: teamMembers[7], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk26', projectId: 'w1', title: '产品交付外观质检和测试',
    description: '', assignee: teamMembers[7], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk27', projectId: 'w1', title: '宣传片制作及广告推广',
    description: '', assignee: teamMembers[7], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk28', projectId: 'w1', title: 'ego采集视频数据处理管线搭建',
    description: '', assignee: teamMembers[8], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk29', projectId: 'w1', title: 'pi0.7模型能否在pi0.5基础上调整',
    description: '', assignee: teamMembers[8], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk30', projectId: 'w1', title: 'ego遥操作及灵巧手训练探索',
    description: '', assignee: teamMembers[8], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk31', projectId: 'w1', title: '采集和推理在各机械臂复现pi0.5模型推理',
    description: '', assignee: teamMembers[9], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk32', projectId: 'w1', title: 'semg的imu选型和结合',
    description: '', assignee: teamMembers[9], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk33', projectId: 'w1', title: '堆木头机械臂对齐训练',
    description: '', assignee: teamMembers[9], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk34', projectId: 'w1', title: '所有新设备画板子（润峰安排）',
    description: '', assignee: teamMembers[10], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
  {
    id: 'wk35', projectId: 'w1', title: '新设备外形调整（润峰安排）',
    description: '', assignee: teamMembers[10], editors: [], viewers: [],
    tags: [], status: 'todo', priority: 'P1', branch: 'weekly',
    createdAt: '2026-07-06', updatedAt: '2026-07-06',
    transferHistory: [],
  },
];

// ============================================================
// 问题
// ============================================================
export const issues: Issue[] = [];

// ============================================================
// 代码版本历史（普通成员只能上传，admin可下载）
// ============================================================
export const fileVersions: FileVersion[] = [
  {
    id: 'fv1', version: 'v1', filename: 'umi3d_control.py',
    projectId: 'p1', uploader: teamMembers[2],
    description: 'UMI3D基础控制模块',
    diff: '初始版本：基础控制模块，支持6DoF位姿控制',
    timestamp: '2026-06-20 10:00', size: '12KB', hash: 'a1b2c3d',
    parentId: null,
  },
  {
    id: 'fv2', version: 'v2', filename: 'umi3d_control.py',
    projectId: 'p1', uploader: teamMembers[2],
    description: '添加夹爪同步控制',
    diff: '+ 夹爪开合控制函数\n+ 位姿与夹爪同步发送\n+ 延迟补偿机制',
    timestamp: '2026-06-22 14:30', size: '18KB', hash: 'e4f5g6h',
    parentId: 'fv1',
  },
  {
    id: 'fv3', version: 'v3', filename: 'umi3d_control.py',
    projectId: 'p1', uploader: teamMembers[4],
    description: '修复遥操延迟问题',
    diff: '+ TCP直连模式\n+ 异步发送队列\n- 移除ROS中间层转发',
    timestamp: '2026-06-25 09:00', size: '21KB', hash: 'i7j8k9l',
    parentId: 'fv2',
  },
  {
    id: 'fv4', version: 'v4', filename: 'umi3d_control.py',
    projectId: 'p1', uploader: teamMembers[2],
    description: '添加错误重连机制',
    diff: '+ 断线自动重连\n+ 心跳检测\n+ 连接状态回调',
    timestamp: '2026-06-28 16:00', size: '25KB', hash: 'm0n1o2p',
    parentId: 'fv3',
  },
  {
    id: 'fv5', version: 'v1', filename: 'semg_filter.c',
    projectId: 'p3', uploader: teamMembers[9],
    description: 'sEMG基础滤波模块',
    diff: '初始版本：10-500Hz带通滤波 + 50Hz陷波',
    timestamp: '2026-06-18 09:00', size: '8KB', hash: 'q3r4s5t',
    parentId: null,
  },
  {
    id: 'fv6', version: 'v2', filename: 'semg_filter.c',
    projectId: 'p3', uploader: teamMembers[9],
    description: '添加自适应滤波',
    diff: '+ LMS自适应降噪算法\n+ 实时噪声估计\n+ 信噪比提升40%',
    timestamp: '2026-06-24 11:00', size: '15KB', hash: 'u6v7w8x',
    parentId: 'fv5',
  },
  {
    id: 'fv7', version: 'v1', filename: 'rebot_train.py',
    projectId: 'p4', uploader: teamMembers[6],
    description: 'REBOT训练Pipeline',
    diff: '初始版本：基于Diffusion Policy的训练框架',
    timestamp: '2026-06-15 10:00', size: '32KB', hash: 'y9z0a1b',
    parentId: null,
  },
  {
    id: 'fv8', version: 'v2', filename: 'rebot_train.py',
    projectId: 'p4', uploader: teamMembers[9],
    description: '支持多机械臂平台',
    diff: '+ 抽象硬件接口层\n+ REBOT/Piper统一控制\n+ 配置化平台切换',
    timestamp: '2026-06-23 14:00', size: '45KB', hash: 'c2d3e4f',
    parentId: 'fv7',
  },
  {
    id: 'fv9', version: 'v3', filename: 'rebot_train.py',
    projectId: 'p4', uploader: teamMembers[9],
    description: '添加数据增强策略',
    diff: '+ 时域抖动增强\n+ 空间扰动增强\n+ 成功率提升15%',
    timestamp: '2026-06-27 09:30', size: '52KB', hash: 'g5h6i7j',
    parentId: 'fv8',
  },
];

// ============================================================
// Git Graph Nodes
// ============================================================
export const gitNodes: GitNode[] = [
  { x: 200, y: 150, type: 'commit', user: 'A' },
  { x: 300, y: 300, type: 'merge', user: 'B' },
  { x: 500, y: 200, type: 'commit', user: 'C' },
  { x: 250, y: 450, type: 'branch', user: 'A' },
  { x: 600, y: 350, type: 'commit', user: 'D' },
  { x: 450, y: 500, type: 'merge', user: 'E' },
  { x: 700, y: 150, type: 'commit', user: 'F' },
  { x: 800, y: 400, type: 'branch', user: 'B' },
  { x: 350, y: 600, type: 'commit', user: 'C' },
  { x: 650, y: 550, type: 'merge', user: 'D' },
  { x: 900, y: 250, type: 'commit', user: 'E' },
  { x: 150, y: 700, type: 'branch', user: 'F' },
  { x: 500, y: 750, type: 'commit', user: 'A' },
  { x: 850, y: 650, type: 'merge', user: 'C' },
  { x: 1000, y: 500, type: 'commit', user: 'D' },
];

// ============================================================
// Sprint Info
// ============================================================
export const sprintInfo = {
  currentSprint: 3,
  daysRemaining: 7,
  totalDays: 14,
  totalCommits: 186,
  activeBranches: 12,
  sprintGoal: '完成产品交付准备，AlohaMini方案确定',
};

// ============================================================
// Helpers
// ============================================================
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
export function getMemberById(id: string): TeamMember | undefined {
  return teamMembers.find((m) => m.id === id);
}
export function getProjectColor(id: string): string {
  const colors: Record<string, string> = {
    p1: '#1868d6', p2: '#10b981', p3: '#d7244b', p4: '#f59e0b',
    p5: '#8b5cf6', p6: '#06b6d4', p7: '#e87940',
  };
  if (colors[id]) return colors[id];
  // 新增项目：按 id 稳定哈希取调色板色，保证各处颜色一致
  const palette = ['#1868d6', '#10b981', '#d7244b', '#f59e0b', '#8b5cf6', '#06b6d4', '#e87940', '#ec4899', '#14b8a6', '#eab308'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// 移交节点数据
export function getTransferNodes() {
  const nodes: Array<{
    id: string; taskId: string; taskTitle: string;
    from: TeamMember | null; to: TeamMember;
    timestamp: string; projectId: string; y: number;
  }> = [];
  let y = 0;
  tasks.forEach((task) => {
    task.transferHistory.forEach((h) => {
      nodes.push({ id: h.id, taskId: task.id, taskTitle: task.title,
        from: h.from, to: h.to, timestamp: h.timestamp, projectId: task.projectId, y: y++,
      });
    });
  });
  issues.forEach((issue) => {
    issue.transferHistory.forEach((h) => {
      nodes.push({ id: h.id, taskId: issue.id, taskTitle: issue.title,
        from: h.from, to: h.to, timestamp: h.timestamp, projectId: issue.projectId, y: y++,
      });
    });
  });
  return nodes;
}
