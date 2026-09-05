import ListSidebar from '@/components/ui/ListSidebar';
import Shell from '@/components/ui/Shell';

export default function NotFound() {
	return (
		<Shell sidebar={<ListSidebar />}>
			<h1 className="mb-3">페이지를 찾을 수 없습니다</h1>
			<p className="text-fg-muted">
				주소가 바뀌었거나 삭제된 글일 수 있습니다. <a href="/">글 목록</a>으로 돌아가세요.
			</p>
		</Shell>
	);
}
