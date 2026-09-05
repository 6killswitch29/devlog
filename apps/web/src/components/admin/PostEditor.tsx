'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { previewAction } from '@/app/admin/actions';
import { isValidSlug, toFileText, type PostForm } from '@/lib/admin/post-file';

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; url: string } | { kind: 'error'; message: string };

const field = 'w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-[0.9375rem] outline-none focus:border-accent';
const label = 'mb-1 block text-[0.75rem] font-semibold tracking-wide text-fg-muted';

/**
 * 글 편집기. 마크다운을 **텍스트 그대로** 다루고, 저장하면 저장소에 커밋한다.
 * 미리보기는 /api/admin/preview가 배포와 같은 파이프라인으로 렌더한 HTML이다.
 */
export default function PostEditor({
	initial,
	sha,
	isNew = false,
}: {
	initial: PostForm;
	sha?: string;
	isNew?: boolean;
}) {
	const [form, setForm] = useState<PostForm>(initial);
	const [tab, setTab] = useState<'write' | 'preview'>('write');
	const [preview, setPreview] = useState<{ node: ReactNode } | { error: string } | null>(null);
	const [status, setStatus] = useState<Status>({ kind: 'idle' });
	const [currentSha, setCurrentSha] = useState(sha);
	const bodyRef = useRef<HTMLTextAreaElement>(null);

	const set = <K extends keyof PostForm>(key: K, value: PostForm[K]) => setForm((f) => ({ ...f, [key]: value }));
	const fileText = useMemo(() => toFileText(form), [form]);

	const problems = useMemo(() => {
		const list: string[] = [];
		if (!isValidSlug(form.slug)) list.push('파일명은 YYYY-MM-DD-slug 형식이어야 합니다.');
		if (!form.title.trim()) list.push('제목이 비었습니다.');
		if (!form.description.trim()) list.push('한 줄 설명이 비었습니다.');
		if (!form.tags.trim()) list.push('태그를 하나 이상 넣으세요.');
		return list;
	}, [form]);

	const save = useCallback(async () => {
		if (problems.length > 0) {
			setStatus({ kind: 'error', message: problems[0] });
			return;
		}
		setStatus({ kind: 'saving' });
		const res = await fetch('/api/admin/save', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ slug: form.slug, text: toFileText(form), sha: currentSha, isNew }),
		});
		const data = (await res.json()) as { commitUrl?: string; sha?: string; error?: string };
		if (!res.ok) {
			setStatus({ kind: 'error', message: data.error ?? '저장 실패' });
			return;
		}
		setCurrentSha(data.sha);
		setStatus({ kind: 'saved', url: data.commitUrl ?? '' });
	}, [form, currentSha, isNew, problems]);

	// ⌘S / Ctrl+S 로 저장
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
				e.preventDefault();
				void save();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [save]);

	async function showPreview() {
		setTab('preview');
		setPreview(null);
		const result = await previewAction(fileText);
		setPreview(result.error ? { error: result.error } : { node: result.node });
	}

	return (
		<main className="flex flex-col gap-5">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-baseline gap-3">
					<a href="/admin" className="text-[0.875rem] text-fg-muted hover:text-fg hover:no-underline">
						← 목록
					</a>
					<h1 className="text-[1.25rem]">{isNew ? '새 글' : '글 수정'}</h1>
				</div>
				<div className="flex items-center gap-3">
					{status.kind === 'error' && <span className="text-[0.8125rem] text-accent">{status.message}</span>}
					{status.kind === 'saved' && (
						<span className="text-[0.8125rem] text-fg-muted">
							저장됨 ·{' '}
							<a href={status.url} target="_blank" rel="noreferrer">
								커밋 보기 ↗
							</a>
						</span>
					)}
					<button
						type="button"
						onClick={() => void save()}
						disabled={status.kind === 'saving'}
						className="inline-flex h-9 items-center rounded-[var(--radius)] border border-fg bg-fg px-4 text-[0.875rem] font-medium text-bg hover:bg-accent hover:text-white disabled:opacity-50"
					>
						{status.kind === 'saving' ? '저장 중…' : '저장 (⌘S)'}
					</button>
				</div>
			</header>

			<div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
				{/* 본문 */}
				<section className="order-2 flex min-w-0 flex-col lg:order-1">
					<div className="mb-2 flex gap-1">
						{(['write', 'preview'] as const).map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => (key === 'preview' ? void showPreview() : setTab('write'))}
								className={`rounded-full px-3 py-1 text-[0.8125rem] ${
									tab === key ? 'bg-bg-subtle font-semibold text-fg' : 'text-fg-muted hover:text-fg'
								}`}
							>
								{key === 'write' ? '본문' : '미리보기'}
							</button>
						))}
					</div>

					{tab === 'write' ? (
						<textarea
							ref={bodyRef}
							value={form.body}
							onChange={(e) => set('body', e.target.value)}
							spellCheck={false}
							placeholder={'## 첫 번째 제목\n\n마크다운 그대로 씁니다. 저장하면 파일이 이 내용 그대로 커밋됩니다.'}
							className="min-h-[60vh] w-full resize-y rounded-[var(--radius)] border border-border bg-bg p-4 font-mono text-[0.875rem] leading-relaxed outline-none focus:border-accent"
						/>
					) : (
						<div className="min-h-[60vh] rounded-[var(--radius)] border border-border p-5">
							{preview === null ? (
								<p className="text-fg-muted">렌더 중…</p>
							) : 'error' in preview ? (
								<p className="text-accent">{preview.error}</p>
							) : (
								<div className="prose">{preview.node}</div>
							)}
						</div>
					)}
				</section>

				{/* frontmatter */}
				<aside className="order-1 flex flex-col gap-3 lg:order-2">
					<div>
						<label className={label} htmlFor="slug">
							파일명 (YYYY-MM-DD-slug)
						</label>
						<input
							id="slug"
							value={form.slug}
							onChange={(e) => set('slug', e.target.value)}
							className={`${field} font-mono`}
							placeholder="2026-09-06-my-post"
						/>
						<p className="mt-1 text-[0.75rem] text-fg-muted">/blog/{form.slug || '…'}/ 로 열린다.</p>
					</div>
					<div>
						<label className={label} htmlFor="title">
							제목
						</label>
						<input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} className={field} />
					</div>
					<div>
						<label className={label} htmlFor="description">
							한 줄 설명
						</label>
						<textarea
							id="description"
							value={form.description}
							onChange={(e) => set('description', e.target.value)}
							rows={3}
							className={field}
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className={label} htmlFor="pubDate">
								발행일
							</label>
							<input
								id="pubDate"
								type="date"
								value={form.pubDate}
								onChange={(e) => set('pubDate', e.target.value)}
								className={field}
							/>
						</div>
						<div>
							<label className={label} htmlFor="updatedDate">
								수정일
							</label>
							<input
								id="updatedDate"
								type="date"
								value={form.updatedDate}
								onChange={(e) => set('updatedDate', e.target.value)}
								className={field}
							/>
						</div>
					</div>
					<div>
						<label className={label} htmlFor="tags">
							태그 (쉼표로 구분)
						</label>
						<input
							id="tags"
							value={form.tags}
							onChange={(e) => set('tags', e.target.value)}
							className={field}
							placeholder="nextjs, migration"
						/>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className={label} htmlFor="series">
								시리즈
							</label>
							<input id="series" value={form.series} onChange={(e) => set('series', e.target.value)} className={field} />
						</div>
						<div>
							<label className={label} htmlFor="seriesOrder">
								순서
							</label>
							<input
								id="seriesOrder"
								type="number"
								min={1}
								value={form.seriesOrder}
								onChange={(e) => set('seriesOrder', e.target.value)}
								className={field}
							/>
						</div>
					</div>
					<label className="flex items-center gap-2 text-[0.9375rem]">
						<input type="checkbox" checked={form.draft} onChange={(e) => set('draft', e.target.checked)} />
						초안 (배포에서 제외)
					</label>

					{problems.length > 0 && (
						<ul className="rounded-[var(--radius)] border border-border bg-bg-subtle px-3 py-2 text-[0.8125rem] text-fg-muted">
							{problems.map((problem) => (
								<li key={problem}>· {problem}</li>
							))}
						</ul>
					)}
				</aside>
			</div>
		</main>
	);
}
