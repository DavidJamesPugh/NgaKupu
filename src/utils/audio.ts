/**
 * Placeholder audio utility. Once Expo AV is integrated this module will
 * expose helpers for loading and playing local or remote audio assets.
 */
export interface AudioSource {
  /**
   * Remote URL or local asset reference.
   * For now this is a string so we can pass sample data.
   */
  uri: string;
  /**
   * Whether the resource lives locally inside the bundle.
   */
  type: 'remote' | 'local';
}

export interface AudioPlaybackOptions {
  /**
    * Placeholder for playback volume support.
    */
  volume?: number;
}

export const playAudio = async (
  source: AudioSource,
  _options: AudioPlaybackOptions = {},
) => {
  // eslint-disable-next-line no-console
  console.warn(
    'TODO: integrate Expo AV playback. Requested source:',
    source.uri,
  );
  return Promise.resolve();
};

export const stopAudio = async () => {
  // eslint-disable-next-line no-console
  console.warn('TODO: stop audio playback when Expo AV is available.');
  return Promise.resolve();
};
