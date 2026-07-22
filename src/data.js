/**
 * data.js – Re-exports data through dataService
 * 
 * This module acts as a compatibility bridge.
 * The main site (main.js) imports data from here.
 * Data is now managed via dataService (localStorage → Firebase ready).
 * 
 * For backward compat, we also export static constants that match
 * the original shape. The main.js has been updated to load data
 * asynchronously from dataService at init time.
 */

import { dataService } from './services/dataService.js';

// Re-export dataService for convenience
export { dataService };

// Legacy static exports (used as fallbacks / for non-async contexts)
export const CURATION_DATA = [];
export const SECRET_PINS_DATA = [];
export const GUIDEBOOK_DATA = [];
export const TESTIMONIAL_DATA = [];

// Async loader — called from main.js on DOMContentLoaded
export async function loadAllData() {
  const curations = await dataService.getCurations();
  const guidebooks = await dataService.getGuidebooks();
  const testimonials = await dataService.getTestimonials();
  const secretPins = await dataService.getSecretPins();
  const siteSettings = await dataService.getSiteSettings();

  return { curations, guidebooks, testimonials, secretPins, siteSettings };
}
