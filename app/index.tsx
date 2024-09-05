import { WebView, WebViewMessageEvent } from "react-native-webview";
import { StyleSheet } from "react-native";
import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from "@notifee/react-native";
import dayjs from "dayjs";

interface Schedule {
  id: string;
  stationId: string;
  trainId: string;
  line: string;
  route: string;
  color: string;
  destination: string;
  timeEstimated: string;
  destinationTime: string;
  updatedAt: string;
}

interface ReminderPayload {
  schedule: Schedule;
  station: { id: string; name: string };
  beforeMinutes: number;
}
interface Message {
  action: string;
  payload: ReminderPayload;
}
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLocaleLowerCase();
}
const setReminder = async (payload: ReminderPayload) => {
  await notifee.requestPermission();
  const channelId = await notifee.createChannel({
    id: "reminder",
    name: "Daily Reminder",
  });
  const { schedule, beforeMinutes, station } = payload;
  const [hour, minute] = schedule.timeEstimated.split(":");
  const date = dayjs()
    .set("hour", Number(hour))
    .set("minute", Number(minute))
    .add(1, "day")
    .subtract(beforeMinutes + 1, "minute");

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.toDate().getTime(), // fire in 3 hours
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      id: schedule.id,
      title: `Train From ${station.name} to ${capitalize(
        schedule.destination
      )}`,
      body: `Will be arrived in ${station.name} at ${
        schedule.timeEstimated
      } WIB (in ${beforeMinutes === 0 ? 1 : beforeMinutes} minutes).`,
      subtitle: "Train Reminder",
      android: {
        channelId,
        smallIcon: "notification_icon",
      },
    },
    trigger
  );
};

const unsetReminder = async (payload: ReminderPayload) => {
  const { schedule } = payload;
  notifee.cancelTriggerNotification(schedule.id);
};

export default function Index() {
  const handleMessage = (event: WebViewMessageEvent) => {
    const parsed = JSON.parse(event.nativeEvent.data) as Message;
    const { action, payload } = parsed;

    switch (action) {
      case "SET_REMINDER":
        setReminder(payload);
        break;
      case "UNSET_REMINDER":
        unsetReminder(payload);
        break;
      default:
        break;
    }
  };

  return (
    <WebView
      onMessage={handleMessage}
      style={styles.container}
      source={{
        uri:
          process.env.EXPO_PUBLIC_WEBVIEW_URI ||
          "https://comuline-web.vercel.app/",
      }}
    />
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
