export interface Month {
  art_file_uploaded: boolean;
  month_name: string;
  month_number: number;
  csv_file_uploaded?: boolean;
}

export interface Program {
  id: string;
  program_name: string;
  program_id?: string;
  channel_id?: string;
  channel_name?: string;
  category?: string;
  category_name?: string;
  cover_all?: boolean;
  cover_space?: boolean;
  months: Month[];
}

export interface ArtFilesDetails {
  get_csv_files: boolean;
  programs: Program[];
}

export interface FileUploadState {
  [programId: string]: {
    [monthNumber: number]: {
      artFile: File | null;
      csvFile: File | null;
      artUploaded: boolean;
      csvUploaded: boolean;
    };
  };
}

export interface MonthFileState {
  artFile: File | null;
  csvFile: File | null;
  artUploaded: boolean;
  csvUploaded: boolean;
}
