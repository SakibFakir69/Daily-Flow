const { withAppBuildGradle } = require("expo/config-plugins");

/**
 * EAS regenerates the `android/` folder on every prebuild, so any manual edit
 * to `android/app/build.gradle` is lost. This config plugin re-injects the fix
 * on each prebuild.
 *
 * Problem: `react-native-android-widget` pulls in `work-runtime-ktx:2.7.1`,
 * while another dependency forces `work-runtime:2.8.1`. As of WorkManager 2.8.0
 * the `-ktx` Kotlin extension classes (OneTimeWorkRequestKt, etc.) were merged
 * into the main `work-runtime` artifact, so having the old 2.7.1 ktx alongside
 * work-runtime 2.8.1 puts those classes on the classpath twice and
 * `checkReleaseDuplicateClasses` fails.
 *
 * Fix: force `work-runtime-ktx` up to 2.8.1. At 2.8.1 the ktx artifact is an
 * empty stub that just redirects to `work-runtime`, so no duplicate classes
 * remain while any dependency that imports from the ktx package still resolves.
 */
const FORCE_BLOCK = `
configurations.all {
    resolutionStrategy {
        force "androidx.work:work-runtime:2.8.1"
        force "androidx.work:work-runtime-ktx:2.8.1"
    }
}
`;

const MARKER = 'force "androidx.work:work-runtime-ktx:2.8.1"';

const withWorkRuntimeFix = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "withWorkRuntimeFix is only supported for Groovy build.gradle files."
      );
    }
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += FORCE_BLOCK;
    }
    return config;
  });
};

module.exports = withWorkRuntimeFix;
