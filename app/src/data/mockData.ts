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
    id: 'm9', name: '小组协作', avatar: '/team-avatars.png',
    role: '团队协作', initials: 'XZ', color: '#6366f1',
    userRole: 'member', status: 'active', joinedAt: '2026-05-01',
    phone: '13800000019', password: 'xiaozu',
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
    id: 'p1', name: 'UMI 系列', description: 'UMI3D软硬件、夹爪数据交互、遥操作',
    status: 'active', lead: teamMembers[2], members: [teamMembers[2], teamMembers[4]],
    startDate: '2026-06-01',
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
    id: 't1', projectId: 'p1', title: 'UMI3D软硬件打包交付',
    description: '完成UMI3D硬件组装、软件环境配置、整体打包交付给客户',
    status: 'in-progress', priority: 'P0', branch: 'feat/umi3d-delivery',
    assignee: teamMembers[2], createdAt: '2026-06-25', updatedAt: '2026-06-30',
    tags: ['UMI', '交付'],
    transferHistory: [
      { id: 'th1', from: null, to: teamMembers[2], timestamp: '2026-06-25 09:00', reason: '任务创建' },
    ],
    editors: ['m1'], // 陈润峰可编辑
    viewers: ['m1', 'm3'],
  },
  {
    id: 't2', projectId: 'p1', title: 'UMI采集测试',
    description: 'UMI设备采集功能全面测试，验证数据采集完整性和准确性',
    status: 'in-progress', priority: 'P0', branch: 'test/umi-collection',
    assignee: teamMembers[2], createdAt: '2026-06-26', updatedAt: '2026-06-30',
    tags: ['UMI', '测试'],
    transferHistory: [
      { id: 'th2', from: null, to: teamMembers[2], timestamp: '2026-06-26 10:00', reason: '任务创建' },
    ],
    editors: ['m1'], viewers: ['m1', 'm3'],
  },
  {
    id: 't3', projectId: 'p1', title: 'UMI夹爪→机械臂数据通路',
    description: '研究UMI夹爪能否直接发送数据给机械臂，实现数据通路对接',
    status: 'todo', priority: 'P1', branch: 'feat/gripper-to-arm',
    assignee: teamMembers[2], createdAt: '2026-06-27', updatedAt: '2026-06-27',
    tags: ['UMI', '夹爪', '机械臂'],
    transferHistory: [
      { id: 'th3', from: null, to: teamMembers[2], timestamp: '2026-06-27 09:00', reason: '任务创建' },
    ],
    editors: ['m1'], viewers: ['m1', 'm3'],
  },
  {
    id: 't4', projectId: 'p1', title: 'UMI遥操REBOT机械臂',
    description: '验证UMI能否遥操REBOT机械臂，端到端遥操作链路验证',
    status: 'todo', priority: 'P1', branch: 'feat/umi-rebot-teleop',
    assignee: teamMembers[2], createdAt: '2026-06-28', updatedAt: '2026-06-28',
    tags: ['UMI', 'REBOT', '遥操'],
    transferHistory: [
      { id: 'th4', from: null, to: teamMembers[2], timestamp: '2026-06-28 09:00', reason: '任务创建' },
    ],
    editors: ['m1'], viewers: ['m1', 'm3'],
  },
  {
    id: 't5', projectId: 'p5', title: 'EGO设备交付',
    description: 'EGO设备整机调试、验收测试、交付客户',
    status: 'in-progress', priority: 'P0', branch: 'feat/ego-delivery',
    assignee: teamMembers[2], createdAt: '2026-06-24', updatedAt: '2026-06-30',
    tags: ['EGO', '交付'],
    transferHistory: [
      { id: 'th5', from: null, to: teamMembers[2], timestamp: '2026-06-24 09:00', reason: '任务创建' },
    ],
    editors: ['m1'], viewers: ['m1', 'm5'],
  },
  {
    id: 't6', projectId: 'p2', title: '触觉手套软件定型',
    description: '完成触觉手套配套软件版本定型，冻结功能需求，输出稳定版本',
    status: 'in-progress', priority: 'P0', branch: 'feat/haptic-glove-final',
    assignee: teamMembers[3], createdAt: '2026-06-22', updatedAt: '2026-06-30',
    tags: ['触觉', '手套', '定型'],
    transferHistory: [
      { id: 'th6', from: null, to: teamMembers[3], timestamp: '2026-06-22 09:00', reason: '任务创建' },
    ],
    editors: ['m2'], viewers: ['m2'],
  },
  {
    id: 't7', projectId: 'p2', title: '夹爪触觉方案研究',
    description: '研究夹爪触觉传感方案，对比不同传感器方案的可行性和成本',
    status: 'in-progress', priority: 'P1', branch: 'research/gripper-haptic',
    assignee: teamMembers[3], createdAt: '2026-06-24', updatedAt: '2026-06-28',
    tags: ['触觉', '夹爪', '研究'],
    transferHistory: [
      { id: 'th7', from: null, to: teamMembers[3], timestamp: '2026-06-24 10:00', reason: '任务创建' },
    ],
    editors: ['m2'], viewers: ['m2'],
  },
  {
    id: 't8', projectId: 'p3', title: 'sEMG+九轴IMU精度调整',
    description: '优化sEMG信号采集精度和九轴IMU姿态解算精度，达到产品级标准',
    status: 'in-progress', priority: 'P0', branch: 'feat/semg-imu-calib',
    assignee: teamMembers[8], createdAt: '2026-06-20', updatedAt: '2026-06-30',
    tags: ['sEMG', 'IMU', '标定'],
    transferHistory: [
      { id: 'th8', from: null, to: teamMembers[4], timestamp: '2026-06-20 09:00', reason: '任务创建' },
      { id: 'th8b', from: teamMembers[4], to: teamMembers[8], timestamp: '2026-06-24 14:00', reason: '陈露佳接手sEMG专项优化' },
    ],
    editors: ['m7'], viewers: ['m3', 'm7'],
  },
  {
    id: 't9', projectId: 'p1', title: 'UMI3D软件打包交付（薛）',
    description: '薛炫豪负责的UMI3D软件部分打包，配合硬件完成整体交付',
    status: 'in-progress', priority: 'P0', branch: 'feat/umi3d-software',
    assignee: teamMembers[4], createdAt: '2026-06-25', updatedAt: '2026-06-30',
    tags: ['UMI', '软件', '交付'],
    transferHistory: [
      { id: 'th9', from: null, to: teamMembers[4], timestamp: '2026-06-25 09:00', reason: '任务创建' },
    ],
    editors: ['m3'], viewers: ['m1', 'm3'],
  },
  {
    id: 't10', projectId: 'p1', title: 'UMI遥操REBOT验证（薛）',
    description: '从算法层面验证UMI遥操REBOT的可行性，输出技术报告',
    status: 'todo', priority: 'P1', branch: 'research/umi-rebot-feasible',
    assignee: teamMembers[4], createdAt: '2026-06-28', updatedAt: '2026-06-28',
    tags: ['UMI', 'REBOT', '遥操'],
    transferHistory: [
      { id: 'th10', from: null, to: teamMembers[4], timestamp: '2026-06-28 09:00', reason: '任务创建' },
    ],
    editors: ['m3'], viewers: ['m1', 'm3'],
  },
  {
    id: 't11', projectId: 'p6', title: '休息待命',
    description: '武鸿旭休整待命，准备后续AlohaMini项目',
    status: 'todo', priority: 'P3', branch: 'standby',
    assignee: teamMembers[5], createdAt: '2026-06-30', updatedAt: '2026-06-30',
    tags: ['待命'],
    transferHistory: [
      { id: 'th11', from: null, to: teamMembers[5], timestamp: '2026-06-30 09:00', reason: '休息' },
    ],
    editors: ['m4'], viewers: ['m4'],
  },
  {
    id: 't12', projectId: 'p4', title: 'REBOT和Piper机械臂训练',
    description: '在REBOT和Piper机械臂上进行端到端训练，采集数据并优化策略',
    status: 'in-progress', priority: 'P0', branch: 'feat/rebot-piper-train',
    assignee: teamMembers[6], createdAt: '2026-06-22', updatedAt: '2026-06-30',
    tags: ['REBOT', 'Piper', '训练'],
    transferHistory: [
      { id: 'th12', from: null, to: teamMembers[6], timestamp: '2026-06-22 09:00', reason: '任务创建' },
    ],
    editors: ['m5'], viewers: ['m5'],
  },
  {
    id: 't13', projectId: 'p4', title: '所有产品外观确定',
    description: '确定UMI、REBOT、EGO等产品的最终外观设计方案，输出设计稿',
    status: 'in-progress', priority: 'P0', branch: 'design/product-appearance',
    assignee: teamMembers[6], createdAt: '2026-06-24', updatedAt: '2026-06-28',
    tags: ['外观', '设计'],
    transferHistory: [
      { id: 'th13', from: null, to: teamMembers[6], timestamp: '2026-06-24 09:00', reason: '任务创建' },
    ],
    editors: ['m5'], viewers: ['m5'],
  },
  {
    id: 't14', projectId: 'p5', title: 'EGO设备SLAM算法优化',
    description: '优化EGO设备上的SLAM算法精度和实时性，提升定位稳定性',
    status: 'todo', priority: 'P1', branch: 'feat/ego-slam-opt',
    assignee: teamMembers[6], createdAt: '2026-06-27', updatedAt: '2026-06-27',
    tags: ['EGO', 'SLAM'],
    transferHistory: [
      { id: 'th14', from: null, to: teamMembers[6], timestamp: '2026-06-27 09:00', reason: '任务创建' },
    ],
    editors: ['m5'], viewers: ['m5'],
  },
  {
    id: 't15', projectId: 'p5', title: 'EGO深度算法优化',
    description: '优化EGO设备的深度估计算法，提升深度图精度和帧率',
    status: 'todo', priority: 'P1', branch: 'feat/ego-depth-opt',
    assignee: teamMembers[6], createdAt: '2026-06-27', updatedAt: '2026-06-27',
    tags: ['EGO', '深度'],
    transferHistory: [
      { id: 'th15', from: null, to: teamMembers[6], timestamp: '2026-06-27 10:00', reason: '任务创建' },
    ],
    editors: ['m5'], viewers: ['m5'],
  },
  {
    id: 't16', projectId: 'p6', title: 'AlohaMini机器人研究',
    description: '陈润峰、肖文博、武鸿旭、刘世文共同研究AlohaMini机器人方案',
    status: 'in-progress', priority: 'P0', branch: 'research/alohamini',
    assignee: teamMembers[10], createdAt: '2026-06-25', updatedAt: '2026-06-30',
    tags: ['AlohaMini', '研究'],
    transferHistory: [
      { id: 'th16', from: null, to: teamMembers[10], timestamp: '2026-06-25 09:00', reason: '小组任务创建' },
    ],
    editors: ['m1', 'm5', 'm4', 'm6'],
    viewers: ['m1', 'm5', 'm4', 'm6'],
  },
  {
    id: 't17', projectId: 'p6', title: '语音交互方案先行',
    description: 'AlohaMini项目先做语音交互方案，作为人机交互入口',
    status: 'in-progress', priority: 'P0', branch: 'feat/voice-interaction',
    assignee: teamMembers[10], createdAt: '2026-06-26', updatedAt: '2026-06-30',
    tags: ['AlohaMini', '语音'],
    transferHistory: [
      { id: 'th17', from: null, to: teamMembers[10], timestamp: '2026-06-26 09:00', reason: '任务创建' },
    ],
    editors: ['m1', 'm5', 'm4', 'm6'],
    viewers: ['m1', 'm5', 'm4', 'm6'],
  },
  {
    id: 't18', projectId: 'p7', title: '品牌参数手册撰写',
    description: '撰写所有产品的品牌参数手册，包含技术规格、功能列表',
    status: 'in-progress', priority: 'P0', branch: 'doc/brand-manual',
    assignee: teamMembers[7], createdAt: '2026-06-23', updatedAt: '2026-06-30',
    tags: ['文档', '品牌'],
    transferHistory: [
      { id: 'th18', from: null, to: teamMembers[7], timestamp: '2026-06-23 09:00', reason: '任务创建' },
    ],
    editors: ['m6'], viewers: ['m6'],
  },
  {
    id: 't19', projectId: 'p7', title: '用户文档撰写',
    description: '编写用户操作手册和快速入门指南',
    status: 'in-progress', priority: 'P0', branch: 'doc/user-guide',
    assignee: teamMembers[7], createdAt: '2026-06-24', updatedAt: '2026-06-28',
    tags: ['文档', '用户'],
    transferHistory: [
      { id: 'th19', from: null, to: teamMembers[7], timestamp: '2026-06-24 09:00', reason: '任务创建' },
    ],
    editors: ['m6'], viewers: ['m6'],
  },
  {
    id: 't20', projectId: 'p7', title: '质量评估撰写',
    description: '编写产品质量评估报告，包含测试结果和质检数据',
    status: 'in-progress', priority: 'P1', branch: 'doc/quality-report',
    assignee: teamMembers[7], createdAt: '2026-06-25', updatedAt: '2026-06-29',
    tags: ['文档', '质量'],
    transferHistory: [
      { id: 'th20', from: null, to: teamMembers[7], timestamp: '2026-06-25 09:00', reason: '任务创建' },
    ],
    editors: ['m6'], viewers: ['m6'],
  },
  {
    id: 't21', projectId: 'p7', title: '代码管理',
    description: '统一管理项目代码仓库、版本控制、分支策略',
    status: 'in-progress', priority: 'P1', branch: 'dev/code-management',
    assignee: teamMembers[7], createdAt: '2026-06-22', updatedAt: '2026-06-30',
    tags: ['代码', '管理'],
    transferHistory: [
      { id: 'th21', from: null, to: teamMembers[7], timestamp: '2026-06-22 09:00', reason: '任务创建' },
    ],
    editors: ['m6'], viewers: ['m6'],
  },
  {
    id: 't22', projectId: 'p7', title: 'EGO和UMI外观质检',
    description: '对EGO和UMI交付产品进行外观质检和功能测试',
    status: 'todo', priority: 'P0', branch: 'test/ego-umi-qa',
    assignee: teamMembers[7], createdAt: '2026-06-29', updatedAt: '2026-06-29',
    tags: ['质检', 'EGO', 'UMI'],
    transferHistory: [
      { id: 'th22', from: null, to: teamMembers[7], timestamp: '2026-06-29 09:00', reason: '任务创建' },
    ],
    editors: ['m6'], viewers: ['m6'],
  },
  {
    id: 't23', projectId: 'p3', title: 'sEMG精度优化',
    description: '进一步优化sEMG肌电信号的采集精度，降低噪声干扰',
    status: 'in-progress', priority: 'P0', branch: 'feat/semg-opt',
    assignee: teamMembers[8], createdAt: '2026-06-23', updatedAt: '2026-06-30',
    tags: ['sEMG', '优化'],
    transferHistory: [
      { id: 'th23', from: null, to: teamMembers[8], timestamp: '2026-06-23 09:00', reason: '任务创建' },
      { id: 'th23b', from: teamMembers[4], to: teamMembers[8], timestamp: '2026-06-24 14:00', reason: '薛炫豪移交陈露佳专项优化' },
    ],
    editors: ['m7'], viewers: ['m3', 'm7'],
  },
  {
    id: 't24', projectId: 'p5', title: 'EGO视频数据处理管线',
    description: '搭建EGO采集视频数据的处理管线，预处理、标注、训练数据生成',
    status: 'in-progress', priority: 'P1', branch: 'feat/ego-video-pipeline',
    assignee: teamMembers[9], createdAt: '2026-06-26', updatedAt: '2026-06-28',
    tags: ['EGO', '视频', '管线'],
    transferHistory: [
      { id: 'th24', from: null, to: teamMembers[9], timestamp: '2026-06-26 09:00', reason: '任务创建' },
    ],
    editors: ['m7'], viewers: ['m5', 'm7'],
  },
  {
    id: 't25', projectId: 'p4', title: '采集推理跨机械臂复现',
    description: '将采集推理pipeline在不同机械臂平台上复现，验证通用性',
    status: 'in-progress', priority: 'P0', branch: 'feat/deploy-multi-arm',
    assignee: teamMembers[10], createdAt: '2026-06-23', updatedAt: '2026-06-30',
    tags: ['机械臂', '复现'],
    transferHistory: [
      { id: 'th25', from: null, to: teamMembers[10], timestamp: '2026-06-23 09:00', reason: '任务创建' },
    ],
    editors: ['m8'], viewers: ['m5', 'm8'],
  },
  {
    id: 't26', projectId: 'p6', title: 'AlohaMini方案搭建',
    description: '搭建AlohaMini机器人的整体方案，硬件选型和软件架构',
    status: 'in-progress', priority: 'P0', branch: 'feat/alohamini-setup',
    assignee: teamMembers[10], createdAt: '2026-06-25', updatedAt: '2026-06-30',
    tags: ['AlohaMini', '方案'],
    transferHistory: [
      { id: 'th26', from: null, to: teamMembers[10], timestamp: '2026-06-25 09:00', reason: '任务创建' },
    ],
    editors: ['m8'], viewers: ['m8'],
  },
];

// ============================================================
// 问题
// ============================================================
export const issues: Issue[] = [
  {
    id: 'i1', projectId: 'p1', title: 'UMI3D打包后软件启动异常',
    description: '打包后的UMI3D软件在客户机器上启动时崩溃，可能与环境依赖有关',
    solution: '检查依赖库版本兼容性，添加环境检测脚本，提供一键安装包',
    status: 'open', priority: 'P0', reporter: teamMembers[7], assignee: teamMembers[2],
    createdAt: '2026-06-29',
    tags: ['UMI', '打包'],
    transferHistory: [
      { id: 'ith1', from: null, to: teamMembers[2], timestamp: '2026-06-29 10:00', reason: '问题上报' },
    ],
  },
  {
    id: 'i2', projectId: 'p4', title: 'Piper机械臂通信延迟',
    description: 'Piper机械臂在训练过程中出现200ms+的通信延迟，影响策略收敛',
    solution: '优化ROS通信参数，升级到实时内核，调整控制频率',
    status: 'open', priority: 'P0', reporter: teamMembers[6], assignee: teamMembers[10],
    createdAt: '2026-06-28',
    tags: ['Piper', '延迟'],
    transferHistory: [
      { id: 'ith2', from: null, to: teamMembers[10], timestamp: '2026-06-28 10:00', reason: '问题上报' },
    ],
  },
  {
    id: 'i3', projectId: 'p3', title: 'sEMG信号噪声过大',
    description: '特定频率下sEMG信号噪声干扰严重，影响识别精度',
    solution: '增加硬件滤波电路，软件端添加自适应滤波算法',
    status: 'resolved', priority: 'P0', reporter: teamMembers[4], assignee: teamMembers[9],
    createdAt: '2026-06-25', resolvedAt: '2026-06-27',
    tags: ['sEMG', '噪声'],
    transferHistory: [
      { id: 'ith3', from: null, to: teamMembers[9], timestamp: '2026-06-25 10:00', reason: '问题上报' },
    ],
  },
  {
    id: 'i4', projectId: 'p2', title: '触觉手套延迟问题',
    description: '触觉反馈延迟超过50ms，用户能感知到明显滞后',
    solution: '优化通信协议，切换到WebRTC传输，添加预测补偿',
    status: 'open', priority: 'P1', reporter: teamMembers[3], assignee: teamMembers[3],
    createdAt: '2026-06-27',
    tags: ['触觉', '延迟'],
    transferHistory: [
      { id: 'ith4', from: null, to: teamMembers[3], timestamp: '2026-06-27 10:00', reason: '问题上报' },
    ],
  },
  {
    id: 'i5', projectId: 'p5', title: 'EGO深度图边缘模糊',
    description: 'EGO深度图在物体边缘出现模糊和空洞，影响点云质量',
    solution: '优化深度估计算法的边缘保持能力，添加后处理滤波',
    status: 'resolved', priority: 'P1', reporter: teamMembers[6], assignee: teamMembers[6],
    createdAt: '2026-06-24', resolvedAt: '2026-06-26',
    tags: ['EGO', '深度'],
    transferHistory: [
      { id: 'ith5', from: null, to: teamMembers[6], timestamp: '2026-06-24 10:00', reason: '问题上报' },
    ],
  },
];

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
    projectId: 'p4', uploader: teamMembers[10],
    description: '支持多机械臂平台',
    diff: '+ 抽象硬件接口层\n+ REBOT/Piper统一控制\n+ 配置化平台切换',
    timestamp: '2026-06-23 14:00', size: '45KB', hash: 'c2d3e4f',
    parentId: 'fv7',
  },
  {
    id: 'fv9', version: 'v3', filename: 'rebot_train.py',
    projectId: 'p4', uploader: teamMembers[10],
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
