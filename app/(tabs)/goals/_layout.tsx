import { Stack } from 'expo-router';

export default function GoalsLayout() {
  return (
    <Stack 
      screenOptions={{ headerShown: false }} 
      initialRouteName="goals-index"
    >
      <Stack.Screen name="goals-index" />
      <Stack.Screen name="add-goal" />
      <Stack.Screen name="edit-goal" />
    </Stack>
  );
}