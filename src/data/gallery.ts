// Content source: content/gallery.json — **generated**, not hand-edited.
//
// Run `node scripts/build-gallery.mjs` after dropping photos into a folder
// under `content/images/`. It writes the WebP derivatives into
// `public/images/gallery/` and rewrites the manifest.
//
// Deliberately not a CMS collection: ~140 photos would be unusable in the
// /admin editor, and the manifest carries generated values (paths, dimensions)
// that an editor has no way to supply correctly.
import galleryJson from "@content/gallery.json";

export type Photo = {
  id: string;
  /** Lightbox-sized WebP, ~1400px on the long edge. */
  src: string;
  /** Grid-sized WebP, ~600px. */
  thumb: string;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
};

export type Album = {
  slug: string;
  title: string;
  photos: Photo[];
};

export const albums: Album[] = galleryJson as Album[];

export const allPhotos: Photo[] = albums.flatMap((album) => album.photos);

export const photoCount = allPhotos.length;

/**
 * Which album a photo belongs to, used for the lightbox caption.
 * Built once rather than searched per render.
 */
const albumByPhotoId = new Map(
  albums.flatMap((album) => album.photos.map((photo) => [photo.id, album] as const)),
);

export function albumFor(photoId: string): Album | undefined {
  return albumByPhotoId.get(photoId);
}

/**
 * Alt text. The photographs have no captions and nobody has described them, so
 * this says what is honestly known — which team, and which photo of how many —
 * rather than inventing a description of what is happening in the frame.
 *
 * Real alt text needs a person who was there. Until then this at least gives a
 * screen-reader user the album and a position, instead of "IMG_2604".
 */
export function photoAlt(photo: Photo, index: number, total: number, albumTitle: string): string {
  return `${albumTitle} — photo ${index + 1} of ${total}`;
}
