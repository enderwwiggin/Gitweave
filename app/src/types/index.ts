// ============================================================
// 角色与权限系统
// ============================================================

export type UserRole = 'admin' | 'member';

export interface Permission {
  canEdit: boolean;
  canDelete: boolean;
  canTransfer: boolean;
  canDownloadCode: boolean;
  canUploadCode: boolean;
  canManageMembers: boolean;
  canViewAll: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    canEdit: true,
    canDelete: true,
    canTransfer: true,
    canDownloadCode: true,
    canUploadCode: true,
    canManageMembers: true,
    canViewAll: true,
  },
  member: {
    canEdit: false,
    canDelete: false,
    canTransfer: false,
    canDownloadCode: false,
    canUploadCode: true,
    canManageMembers: false,
    canViewAll: false,
  },
};

// 获取用户对特定任务的权限
export function getTaskPermission(
  userId: string,
  userRole: UserRole,
  taskAssigneeId: string
): Permission {
  const base = ROLE_PERMISSIONS[userRole];
  const isOwner = userId === taskAssigneeId;
  const isAdmin = userRole === 'admin';

  return {
    canEdit: base.canEdit || isOwner || isAdmin,
    canDelete: base.canDelete || isAdmin,
    canTransfer: base.canTransfer || isOwner || isAdmin,
    canDownloadCode: base.canDownloadCode || isAdmin,
    canUploadCode: base.canUploadCode || isOwner || isAdmin,
    canManageMembers: base.canManageMembers || isAdmin,
    canViewAll: base.canViewAll || isAdmin,
  };
}

// ============================================================
// 团队成员
// ============================================================

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  initials: string;
  color: string;
  userRole: UserRole;
  status: 'active' | 'inactive';
  joinedAt: string;
  phone: string;
  password: string;
  email?: string;
  idCard?: string;
}

// ============================================================
// 项目
// ============================================================

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  lead: TeamMember;
  members: TeamMember[];
  startDate: string;
  endDate?: string;
}

// ============================================================
// 任务（带权限追踪）
// ============================================================

export interface AssignmentHistory {
  id: string;
  from: TeamMember | null;
  to: TeamMember;
  timestamp: string;
  reason?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  branch: string;
  assignee: TeamMember;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  transferHistory: AssignmentHistory[];
  // 权限：谁可以编辑（只有当前assignee和admin）
  editors: string[]; // member IDs who can edit
  viewers: string[]; // member IDs who can view (includes past owners)
}

// ============================================================
// 问题
// ============================================================

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  solution: string;
  status: 'open' | 'resolved' | 'closed';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  reporter: TeamMember;
  assignee: TeamMember;
  createdAt: string;
  resolvedAt?: string;
  tags: string[];
  transferHistory: AssignmentHistory[];
}

// ============================================================
// 代码版本控制
// ============================================================

export interface FileVersion {
  id: string;
  version: string; // "v1", "v2", "v3" ...
  filename: string;
  projectId: string;
  uploader: TeamMember;
  description: string; // what changed
  diff: string; // diff description
  timestamp: string;
  size: string;
  hash: string; // git-style hash
  parentId: string | null; // previous version id
  attachment?: { name: string; path: string; size: string }; // 可选附件（存于私有数据仓库）
}

export interface CodeCommit {
  id: string;
  hash: string;
  message: string;
  author: TeamMember;
  branch: string;
  timestamp: string;
  files: number;
  additions: number;
  deletions: number;
}

// ============================================================
// Git 可视化
// ============================================================

export interface GitNode {
  x: number;
  y: number;
  type: 'commit' | 'merge' | 'branch';
  user: string;
}

// ============================================================
// Agent 使用心得（框架/工具经验）
// ============================================================

export interface AgentComment {
  id: string;
  author: TeamMember;
  content: string;
  createdAt: string;
}

export interface AgentExperience {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: TeamMember;
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: AgentComment[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 移交可视化
// ============================================================

export interface TransferNode {
  id: string;
  taskId: string;
  taskTitle: string;
  from: TeamMember | null;
  to: TeamMember;
  timestamp: string;
  projectId: string;
  y: number;
}
