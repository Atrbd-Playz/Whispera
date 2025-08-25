import { getRelativeDate, isSameDay } from "@/lib/utils";
import { IMessage } from "@/store/chat-store";

type DateIndicatorProps = {
	message: IMessage;
	previousMessage?: IMessage;
};
const DateIndicator = ({ message, previousMessage }: DateIndicatorProps) => {
	return (
		<>
		{/* //instead of previousMessage create a function that checks the first message of the day and compared that to the current message */}
		{!previousMessage || !isSameDay(previousMessage._creationTime, message._creationTime) ? (
			<div className='flex justify-center'>
				<p className='text-sm text-gray-500 dark:text-zinc-300 dark:hover:bg-zinc-700 mb-2 p-1 z-50 rounded-md dark:bg-zinc-800 px-4'>
					{getRelativeDate(message._creationTime, previousMessage?._creationTime || undefined)}
				</p>
				</div>
			) : null}
		</>
	);
};
export default DateIndicator;