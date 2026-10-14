import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

interface ZipEntryInput {
  relativePath: string;
  data: Buffer;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i] ?? 0;
    const tableVal = CRC_TABLE[(crc ^ byte) & 0xff] ?? 0;
    crc = (crc >>> 8) ^ tableVal;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipArchive(entries: ZipEntryInput[], outputFilePath: string): void {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.relativePath.replace(/\\/g, '/'), 'utf-8');
    const uncompressedData = entry.data;
    const compressedData = zlib.deflateRawSync(uncompressedData);
    const crc = crc32(uncompressedData);

    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6); // General purpose bit flag
    localHeader.writeUInt16LE(8, 8); // Compression method (8 = deflate)
    localHeader.writeUInt16LE(0, 10); // Last mod file time
    localHeader.writeUInt16LE(0x21, 12); // Last mod file date
    localHeader.writeUInt32LE(crc, 14); // CRC-32
    localHeader.writeUInt32LE(compressedData.length, 18); // Compressed size
    localHeader.writeUInt32LE(uncompressedData.length, 22); // Uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // File name length
    localHeader.writeUInt16LE(0, 28); // Extra field length
    nameBuffer.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    const centralHeader = Buffer.alloc(46 + nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
    centralHeader.writeUInt16LE(20, 4); // Version made by
    centralHeader.writeUInt16LE(20, 6); // Version needed to extract
    centralHeader.writeUInt16LE(0, 8); // Flags
    centralHeader.writeUInt16LE(8, 10); // Compression method
    centralHeader.writeUInt16LE(0, 12); // File time
    centralHeader.writeUInt16LE(0x21, 14); // File date
    centralHeader.writeUInt32LE(crc, 16); // CRC-32
    centralHeader.writeUInt32LE(compressedData.length, 20); // Compressed size
    centralHeader.writeUInt32LE(uncompressedData.length, 24); // Uncompressed size
    centralHeader.writeUInt16LE(nameBuffer.length, 28); // File name length
    centralHeader.writeUInt16LE(0, 30); // Extra field length
    centralHeader.writeUInt16LE(0, 32); // File comment length
    centralHeader.writeUInt16LE(0, 34); // Disk number start
    centralHeader.writeUInt16LE(0, 36); // Internal file attributes
    centralHeader.writeUInt32LE(0, 38); // External file attributes
    centralHeader.writeUInt32LE(offset, 42); // Relative offset of local header
    nameBuffer.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    offset += localHeader.length + compressedData.length;
  }

  const centralDirectoryBuffer = Buffer.concat(centralHeaders);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(entries.length, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(entries.length, 10); // Total number of central directory records
  eocd.writeUInt32LE(centralDirectoryBuffer.length, 12); // Size of central directory
  eocd.writeUInt32LE(offset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  const finalBuffer = Buffer.concat([...localHeaders, centralDirectoryBuffer, eocd]);
  fs.writeFileSync(outputFilePath, finalBuffer);
}

export function listZipEntries(zipFilePath: string): string[] {
  const buffer = fs.readFileSync(zipFilePath);
  const names: string[] = [];
  let offset = 0;

  while (offset + 30 <= buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.subarray(nameStart, nameStart + fileNameLength).toString('utf-8');
    names.push(name);
    offset = nameStart + fileNameLength + extraLength + compressedSize;
  }

  return names;
}
