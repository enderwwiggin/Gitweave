import { useState, useMemo } from 'react';
import {
  Heart,
  MessageCircle,
  Search,
  Plus,
  X,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { agentExperiences as initialExperiences, agentTags } from '@/data/agentData';
import { teamMembers, getMemberById } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import type { AgentExperience, AgentComment } from '@/types';

export default function AgentExperience() {
  const [experiences, setExperiences] = useState<AgentExperience[]>(initialExperiences);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTagInput, setFormTagInput] = useState('');

  const { user } = useAuth();
  const currentUserId = user?.id ?? 'm1';
  const currentUser = user ? (getMemberById(user.id) ?? teamMembers[0]) : teamMembers[0];

  const filtered = useMemo(() => {
    return experiences.filter((exp) => {
      const matchesSearch =
        !searchQuery ||
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.author.name.includes(searchQuery);
      const matchesTag = !selectedTag || exp.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [experiences, searchQuery, selectedTag]);

  const toggleLike = (expId: string) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== expId) return exp;
        const hasLiked = exp.likedBy.includes(currentUserId);
        return {
          ...exp,
          likes: hasLiked ? exp.likes - 1 : exp.likes + 1,
          likedBy: hasLiked
            ? exp.likedBy.filter((id) => id !== currentUserId)
            : [...exp.likedBy, currentUserId],
        };
      })
    );
  };

  const addComment = (expId: string) => {
    const content = commentInputs[expId]?.trim();
    if (!content) return;

    const newComment: AgentComment = {
      id: `c-${Date.now()}`,
      author: currentUser,
      content,
      createdAt: '2026-06-30',
    };

    setExperiences((prev) =>
      prev.map((exp) =>
        exp.id === expId
          ? { ...exp, comments: [...exp.comments, newComment] }
          : exp
      )
    );

    setCommentInputs((prev) => ({ ...prev, [expId]: '' }));
  };

  const submitExperience = () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const newExp: AgentExperience = {
      id: `ae-${Date.now()}`,
      title: formTitle,
      summary: formSummary || formContent.slice(0, 100) + '...',
      content: formContent,
      author: currentUser,
      tags: formTags.length > 0 ? formTags : ['AI'],
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: '2026-06-30',
      updatedAt: '2026-06-30',
    };

    setExperiences((prev) => [newExp, ...prev]);
    setFormTitle('');
    setFormSummary('');
    setFormContent('');
    setFormTags([]);
    setShowForm(false);
  };

  const addFormTag = () => {
    const tag = formTagInput.trim();
    if (tag && !formTags.includes(tag)) {
      setFormTags((prev) => [...prev, tag]);
    }
    setFormTagInput('');
  };

  const removeFormTag = (tag: string) => {
    setFormTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-[#f59e0b]" />
          <h2 className="text-xl font-semibold text-[#f4f4f5]">
            Agent 使用心得
          </h2>
          <span className="text-xs font-mono text-[#969699] bg-[#1f1f22] px-2 py-1 rounded-full">
            {experiences.length} 篇
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 text-white text-sm font-medium transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '分享心得'}
        </button>
      </div>

      {/* Publish Form */}
      {showForm && (
        <div className="glass-panel rounded-lg p-5 mb-4 fade-in-up">
          <h3 className="text-sm font-medium text-[#f4f4f5] mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1868d6]" />
            写心得
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">标题</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="给你的心得起个标题..."
                className="w-full h-10 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">摘要</label>
              <input
                type="text"
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="一句话概括核心内容..."
                className="w-full h-10 px-3 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">正文</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="分享你的使用经验、技巧和踩坑记录... 支持 Markdown 格式"
                rows={8}
                className="w-full px-3 py-2 rounded bg-[#050507] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors resize-none font-mono leading-relaxed"
              />
            </div>
            <div>
              <label className="text-xs text-[#969699] mb-1.5 block">标签</label>
              <div className="flex items-center gap-2 flex-wrap">
                {formTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-[#1868d6]/20 text-[#1868d6] px-2 py-1 rounded font-mono"
                  >
                    {tag}
                    <button
                      onClick={() => removeFormTag(tag)}
                      className="hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={formTagInput}
                    onChange={(e) => setFormTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFormTag())}
                    placeholder="添加标签..."
                    className="h-8 px-2 rounded bg-[#050507] border border-[#1f1f22] text-xs text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 w-28"
                  />
                  <button
                    onClick={addFormTag}
                    className="h-8 px-2 rounded bg-[#1f1f22] text-xs text-[#969699] hover:text-[#f4f4f5] transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={submitExperience}
                disabled={!formTitle.trim() || !formContent.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1868d6] hover:bg-[#1868d6]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                发布心得
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#969699]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索标题、内容或作者..."
            className="w-full h-10 pl-10 pr-4 rounded bg-[#111113] border border-[#1f1f22] text-sm text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedTag(null)}
          className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
            !selectedTag
              ? 'bg-[#1868d6]/20 text-[#1868d6]'
              : 'bg-[#1f1f22] text-[#969699] hover:text-[#f4f4f5]'
          }`}
        >
          全部
        </button>
        {agentTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`text-xs px-2.5 py-1 rounded-full font-mono transition-colors ${
              selectedTag === tag
                ? 'bg-[#1868d6]/20 text-[#1868d6]'
                : 'bg-[#1f1f22] text-[#969699] hover:text-[#f4f4f5]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Experience List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3">
        {filtered.map((exp, index) => {
          const isExpanded = expandedId === exp.id;
          const hasLiked = exp.likedBy.includes(currentUserId);

          return (
            <div
              key={exp.id}
              className="glass-panel rounded-lg overflow-hidden fade-in-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Card Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                    style={{ backgroundColor: exp.author.color }}
                  >
                    {exp.author.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#f4f4f5] mb-1">{exp.author.name}</div>
                    <h3 className="text-base font-semibold text-[#f4f4f5] mb-1.5">
                      {exp.title}
                    </h3>
                    <p className="text-sm text-[#969699] leading-relaxed mb-3">
                      {exp.summary}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {exp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono text-[#969699] bg-[#1f1f22] px-1.5 py-0.5 rounded cursor-pointer hover:text-[#1868d6] transition-colors"
                          onClick={() => setSelectedTag(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleLike(exp.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          hasLiked
                            ? 'text-[#d7244b]'
                            : 'text-[#969699] hover:text-[#d7244b]'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`}
                        />
                        <span className="font-mono">{exp.likes}</span>
                      </button>

                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : exp.id)
                        }
                        className="flex items-center gap-1.5 text-xs text-[#969699] hover:text-[#f4f4f5] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-mono">{exp.comments.length}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      <span className="flex items-center gap-1 text-xs text-[#969699]">
                        <Clock className="w-3.5 h-3.5" />
                        {exp.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-[#1f1f22]">
                  {/* Full Content */}
                  <div className="pt-4 mb-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-sm text-[#f4f4f5] leading-relaxed whitespace-pre-wrap font-mono">
                        {exp.content}
                      </div>
                    </div>
                  </div>

                  {/* Comments */}
                  {exp.comments.length > 0 && (
                    <div className="border-t border-[#1f1f22] pt-3 mb-3">
                      <h4 className="text-xs font-mono text-[#969699] mb-3 uppercase tracking-wider">
                        评论 ({exp.comments.length})
                      </h4>
                      <div className="space-y-3">
                        {exp.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start gap-2.5"
                          >
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                              style={{
                                backgroundColor: comment.author.color,
                              }}
                            >
                              {comment.author.initials}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium text-[#f4f4f5]">
                                  {comment.author.name}
                                </span>
                                <span className="text-[10px] text-[#969699]">
                                  {comment.createdAt}
                                </span>
                              </div>
                              <p className="text-xs text-[#969699] leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1f1f22]">
                    <input
                      type="text"
                      value={commentInputs[exp.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [exp.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === 'Enter' && addComment(exp.id)
                      }
                      placeholder="写下你的评论..."
                      className="flex-1 h-9 px-3 rounded bg-[#050507] border border-[#1f1f22] text-xs text-[#f4f4f5] placeholder-[#969699] focus:outline-none focus:border-[#1868d6]/50 transition-colors"
                    />
                    <button
                      onClick={() => addComment(exp.id)}
                      disabled={!commentInputs[exp.id]?.trim()}
                      className="h-9 px-3 rounded bg-[#1868d6] hover:bg-[#1868d6]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-[#969699]">
            <BookOpen className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-sm">暂无匹配的心得</span>
          </div>
        )}
      </div>
    </div>
  );
}
