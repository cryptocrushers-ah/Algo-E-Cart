import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || '';

export interface IPFSUploadResponse {
  ipfsHash: string;
  url: string;
}

/**
 * Upload a file to IPFS using Pinata
 */
export async function uploadToIPFS(file: File): Promise<IPFSUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return { ipfsHash, url };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

/**
 * Upload JSON data to IPFS using Pinata
 */
export async function uploadJSONToIPFS(data: object): Promise<IPFSUploadResponse> {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return { ipfsHash, url };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
}

/**
 * Get IPFS URL from hash
 */
export function getIPFSUrl(hash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}
