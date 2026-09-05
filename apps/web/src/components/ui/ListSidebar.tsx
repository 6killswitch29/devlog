import SidebarFooter from './SidebarFooter';
import SidebarNav from './SidebarNav';
import SidebarProfile from './SidebarProfile';
import TagChips from './TagChips';
import { getAllTags, getPosts } from '@/lib/posts';

/** 목록·태그·소개 페이지가 함께 쓰는 사이드바. */
export default async function ListSidebar({ activeTag }: { activeTag?: string } = {}) {
	const [posts, tags] = await Promise.all([getPosts(), getAllTags()]);

	return (
		<>
			<SidebarProfile />
			<SidebarNav
				items={[
					{ href: '/', label: '글', count: posts.length },
					{ href: '/about', label: '소개' },
				]}
			/>
			<TagChips tags={tags} total={posts.length} active={activeTag} />
			<SidebarFooter />
		</>
	);
}
