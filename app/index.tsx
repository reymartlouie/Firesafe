import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to signin page on app launch
  // You can add authentication logic here later to redirect to (tabs) if logged in
  return <Redirect href="/signin" />;
}
