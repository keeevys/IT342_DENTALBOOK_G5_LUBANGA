import { supabase, supabaseConfigError } from './supabaseClient';

const AVATAR_BUCKET = process.env.REACT_APP_SUPABASE_AVATAR_BUCKET || 'patient-avatars';

export const getAvatarStorageKey = (email) => `dentalbook-avatar-path-${email || 'guest'}`;

const sanitizeEmail = (email) => String(email || 'guest').toLowerCase().replaceAll(/[^a-z0-9.-]+/g, '_');

const getAvatarPath = (email, fileName = 'avatar') => {
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
  return `avatars/${sanitizeEmail(email)}/profile${extension}`;
};

const getAvatarPublicUrl = (path) => {
  if (!path || !supabase) {
    return null;
  }

  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
};

export const readAvatar = (email) => {
  try {
    const storedValue = localStorage.getItem(getAvatarStorageKey(email));

    if (!storedValue) {
      return null;
    }

    if (storedValue.startsWith('data:')) {
      return storedValue;
    }

    return getAvatarPublicUrl(storedValue);
  } catch {
    return null;
  }
};

export const uploadAvatar = async (email, file) => {
  if (supabaseConfigError || !supabase) {
    throw new Error(supabaseConfigError || 'Supabase client is unavailable.');
  }

  const existingPath = localStorage.getItem(getAvatarStorageKey(email));
  const avatarPath = getAvatarPath(email, file.name);
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(avatarPath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    throw uploadError;
  }

  if (existingPath && existingPath !== avatarPath && !existingPath.startsWith('data:')) {
    await supabase.storage.from(AVATAR_BUCKET).remove([existingPath]);
  }

  localStorage.setItem(getAvatarStorageKey(email), avatarPath);

  return getAvatarPublicUrl(avatarPath);
};

export const removeAvatar = async (email) => {
  if (supabase && !supabaseConfigError) {
    const existingPath = localStorage.getItem(getAvatarStorageKey(email));

    if (existingPath && !existingPath.startsWith('data:')) {
      await supabase.storage.from(AVATAR_BUCKET).remove([existingPath]);
    }
  }

  localStorage.removeItem(getAvatarStorageKey(email));
};