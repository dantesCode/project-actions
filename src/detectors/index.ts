import { Detector } from '../types';
import { packageJsonDetector } from './packageJsonDetector';
import { composerJsonDetector } from './composerJsonDetector';
import { makefileDetector } from './makefileDetector';
import { rakefileDetector } from './rakefileDetector';
import { pomXmlDetector } from './pomXmlDetector';
import { gradleDetector } from './gradleDetector';
import { cargoTomlDetector } from './cargoTomlDetector';
import { goModDetector } from './goModDetector';
import { pythonDetector } from './pythonDetector';

export const detectors: Detector[] = [
  packageJsonDetector,
  composerJsonDetector,
  makefileDetector,
  rakefileDetector,
  pomXmlDetector,
  gradleDetector,
  cargoTomlDetector,
  goModDetector,
  pythonDetector,
];

export {
  packageJsonDetector,
  composerJsonDetector,
  makefileDetector,
  rakefileDetector,
  pomXmlDetector,
  gradleDetector,
  cargoTomlDetector,
  goModDetector,
  pythonDetector,
};
