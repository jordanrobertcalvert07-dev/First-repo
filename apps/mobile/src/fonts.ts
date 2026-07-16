import { useFonts, Fraunces_400Regular, Fraunces_500Medium, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { IBMPlexSans_400Regular, IBMPlexSans_500Medium, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

/**
 * Load the bundled OFL faces under the family names used by @lifelike/core tokens.
 * Returns false until the fonts are ready. If loading ever fails, RN falls back to
 * the platform default rather than crashing — the app stays usable.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    'Fraunces-Regular': Fraunces_400Regular,
    'Fraunces-Medium': Fraunces_500Medium,
    'Fraunces-SemiBold': Fraunces_600SemiBold,
    'Fraunces-Bold': Fraunces_700Bold,
    'IBMPlexSans-Regular': IBMPlexSans_400Regular,
    'IBMPlexSans-Medium': IBMPlexSans_500Medium,
    'IBMPlexSans-SemiBold': IBMPlexSans_600SemiBold,
    'IBMPlexMono-Regular': IBMPlexMono_400Regular,
  });
  return loaded;
}
