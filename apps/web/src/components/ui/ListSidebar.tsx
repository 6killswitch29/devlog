import SearchTrigger from '@/components/client/SearchTrigger';
import SidebarFooter from './SidebarFooter';
import SidebarNav from './SidebarNav';
import SidebarProfile from './SidebarProfile';
import TagChips from './TagChips';
import { getAllSeries, getAllTags, getPosts } from '@/lib/posts';
import { getProjects } from '@/lib/projects';

/** 목록·태그·소개 페이지가 함께 쓰는 사이드바. */
export default async function ListSidebar({ activeTag }: { activeTag?: string } = {}) {
	const [posts, tags, series, projects] = await Promise.all([
		getPosts(),
		getAllTags(),
		getAllSeries(),
		getProjects(),
	]);

	return (
		<>
			{/* 모바일에서는 프로필과 검색을 한 줄에 둔다 */}
			<div className="flex items-center justify-between gap-3 lg:block lg:space-y-8">
				<SidebarProfile />
				<SearchTrigger />
			</div>
			<SidebarNav
				items={[
					{ href: '/', label: '글', count: posts.length },
					// 비어 있는 메뉴는 내보내지 않는다
					...(series.length > 0 ? [{ href: '/series', label: '시리즈', count: series.length }] : []),
					...(projects.length > 0 ? [{ href: '/projects', label: '프로젝트', count: projects.length }] : []),
					{ href: '/about', label: '소개' },
				]}
			/>
			<TagChips tags={tags} total={posts.length} active={activeTag} />
			<SidebarFooter />
		</>
	);
}
