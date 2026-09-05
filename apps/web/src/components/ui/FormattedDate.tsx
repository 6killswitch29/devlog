/** 날짜 표기는 와이어프레임에 맞춰 YYYY.MM.DD. 파일명 규약(YYYY-MM-DD)과는 별개다. */
export default function FormattedDate({ date, className }: { date: Date; className?: string }) {
	const iso = date.toISOString().slice(0, 10);
	return (
		<time dateTime={iso} className={className}>
			{iso.replaceAll('-', '.')}
		</time>
	);
}
