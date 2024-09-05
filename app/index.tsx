import { WebViewMessageEvent } from "react-native-webview";
import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AndroidNotificationSetting,
  Notification,
} from "@notifee/react-native";
import dayjs from "dayjs";
import { useEffect } from "react";
import WebContainer from "@/components/WebContainer";

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
    .subtract(beforeMinutes + 1, "minute");

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date.toDate().getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
    alarmManager: {
      allowWhileIdle: true,
    },
  };

  const notificationPayload: Notification = {
    id: schedule.id,
    title: `Train From ${station.name} to ${capitalize(schedule.destination)}`,
    body: `Will be arrived in ${station.name} at ${schedule.timeEstimated} WIB`,
    subtitle: "Train Reminder",
    android: {
      channelId,
      smallIcon: "notification_icon",
    },
  };

  try {
    await notifee.createTriggerNotification(notificationPayload, trigger);
  } catch (err) {
    const errMessage = (err as Error).message;
    switch (errMessage) {
      case "notifee.createTriggerNotification(*) 'trigger.timestamp' date must be in the future.":
        //1. add one day
        const modifiedTrigger: TimestampTrigger = {
          ...trigger,
          timestamp: date.add(1, "day").toDate().getTime(),
        };
        //2. create trigger
        await notifee.createTriggerNotification(
          notificationPayload,
          modifiedTrigger
        );
        //3. fire notification immediatelly
        await notifee.displayNotification(notificationPayload);
        break;

      default:
        break;
    }
  }
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
  const requestAlarmSetings = async () => {
    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm !== AndroidNotificationSetting.ENABLED) {
      await notifee.openAlarmPermissionSettings();
    }
  };

  useEffect(() => {
    requestAlarmSetings();
  }, []);
  return (
    <WebContainer
      onMessage={handleMessage}
      url={
        process.env.EXPO_PUBLIC_WEBVIEW_URI ||
        "https://comuline-web.vercel.app/"
      }
    />
  );
}
