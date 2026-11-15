import { Redirect } from 'expo-router';

/**
 * Placeholder route behind the centre "+" tab. The tab button opens the create modal
 * instead of switching here; this only runs if someone lands on /new directly.
 */
export default function NewRedirect() {
  return <Redirect href="/create" />;
}
