import * as cloudinary from 'cloudinary';
import { LogLevel } from '../interfaces';
import { BadRequestException } from '@nestjs/common';

export enum CloudinaryFolders {
  PHOTOS = 'photos',
  VIDEOS = 'videos',
  PRODUCT_PHOTOS = 'product-photos',
  DOCUMENTS = 'documents',
}

export const uploadToCloudinary = async (dataURL: string, folder: string) => {
  try {
    const uploaded = await cloudinary.v2.uploader.upload(dataURL, { folder });
    return uploaded.secure_url;
  } catch (e) {
    console.log(e);
    global.dataLogsService.log(
      global.req.traceId,
      { source: 'uploadToCloudinary', message: e.message, stackTrace: e.stack },
      LogLevel.ERROR,
    );
    return '';
  }
};

export const addPhotos = async (base64PhotosWithImageData: string[]) => {
  const promisesImages = [];

  (base64PhotosWithImageData || []).forEach((photo, i) => {
    if (photo && !photo.includes('data:image')) {
      throw new BadRequestException(
        `photo must include a data image at index ${i}`,
      );
    }

    if (photo) {
      promisesImages.push(uploadToCloudinary(photo, CloudinaryFolders.PHOTOS));
    }
  });

  if (promisesImages.length > 0) {
    return (await Promise.all(promisesImages)).filter((p) => !!p);
  }

  return [];
};

export const uploadPhotosWithPhotoLinks = async (photos: string[]) => {
  let objPhotos: any = { photoLinks: [], base64Photos: [] };

  if (photos && photos.length > 0) {
    objPhotos = photos.reduce(
      (result, p) => {
        if (p.includes('http') && !p.includes('data:image')) {
          result.photoLinks.push(p);
        } else {
          result.base64Photos.push(p);
        }
        return result;
      },
      { photoLinks: [], base64Photos: [] },
    );
    return [
      ...(await addPhotos(objPhotos.base64Photos)),
      ...objPhotos.photoLinks,
    ];
  }

  return [];
};

export const addVideos = async (base64VideosWithVideoData: string[]) => {
  const promisesVideos = [];

  (base64VideosWithVideoData || []).forEach((video, i) => {
    if (video && !video.includes('data:video')) {
      throw new BadRequestException(
        `Video must include video data at index ${i}`,
      );
    }

    if (video) {
      promisesVideos.push(uploadToCloudinary(video, CloudinaryFolders.VIDEOS));
    }
  });

  if (promisesVideos.length > 0) {
    return (await Promise.all(promisesVideos)).filter((v) => !!v);
  }

  return [];
};

export const uploadMediaWithLinks = async (media: string[]) => {
  let objMedia: any = { mediaLinks: [], base64Media: [] };

  if (media && media.length > 0) {
    objMedia = media.reduce(
      (result, m) => {
        if (m?.includes('http') && !m?.includes('data:')) {
          result.mediaLinks.push(m);
        } else {
          result.base64Media.push(m);
        }
        return result;
      },
      { mediaLinks: [], base64Media: [] },
    );

    const uploadedPhotos = await addPhotos(objMedia.base64Media);
    const uploadedVideos = await addVideos(objMedia.base64Media);

    return [...uploadedPhotos, ...uploadedVideos, ...objMedia.mediaLinks];
  }

  return [];
};
