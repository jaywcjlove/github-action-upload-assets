import fs from 'fs';
import path from 'path';
import { context, getOctokit } from '@actions/github';
import { getInput, info } from '@actions/core';
import FormData from 'form-data';

/**
 * get the release URL from the tag
 * @param tag 'v1.12.23'
 * @returns 
 */
export async function getReleaseURL(tag: string | undefined) {
  const { owner, repo } = context.repo;
  // Get the tag name from the triggered action
  const tagName = context.ref;
  const myToken = getInput('token')

  // This removes the 'refs/tags' portion of the string, i.e. from 'refs/tags/v1.12.23' to 'v1.12.23'
  const currentTag = tag || tagName.replace("refs/tags/", "");
  const octokit = getOctokit(myToken);
  info(`Getting release for tag: ${currentTag}`);
  // Get a release from the tag name
  // API Documentation: https://developer.github.com/v3/repos/releases/#create-a-release
  // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
  const getReleaseResponse = await octokit.rest.repos.getReleaseByTag({
    owner,
    repo,
    tag: currentTag
  });
  return getReleaseResponse.data;
}

export function getAssetName(assetPath: string): string | string[] | undefined {
  try {
    return JSON.parse(assetPath) as string | string[];
  } catch (error) {
    if (assetPath) {
      return assetPath
    }
  }
  return undefined;
}

// Function to upload the file
export async function uploadFile(owner: string, repo: string, releaseId: number, filePath: string) {
  const myToken = getInput('token')
  const octokit = getOctokit(myToken);

  const fileContent = fs.readFileSync(filePath); // Read file content as Buffer
  const fileStat = fs.statSync(filePath);
  const fileName = path.basename(filePath);

  const headers = { 
    'content-type': 'application/octet-stream',
    'content-length': fileStat.size
  };

  const response = await octokit.rest.repos.uploadReleaseAsset({
    owner: owner,
    repo: repo,
    release_id: releaseId,
    headers,
    name: fileName,
    data: fileContent.toString() // Use file content directly
  });

  return response;
}

// Function to upload the file
export async function requestUploadFile(releaseId: number, filePath: string) {
  const myToken = getInput('token')
  const octokit = getOctokit(myToken);
  // const fileStream = fs.createReadStream(filePath);
  // const fileName = path.basename(filePath);
  // const form = new FormData();
  // form.append('file', fileStream, {
  //   filename: fileName,
  //   contentType: 'application/octet-stream'
  // });
  const fileStream = fs.createReadStream(filePath);
  const fileName = path.basename(filePath);
  const fileStat = fs.statSync(filePath);

  const headers = {
    'content-type': 'application/octet-stream',
    'content-length': fileStat.size,
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const { owner, repo } = context.repo;
  const response = await octokit.request('POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}', {
    owner,
    repo,
    release_id: releaseId,
    name: fileName,
    headers,
    data: fileStream
  });
  // const headers = { ...form.getHeaders(), 'Authorization': `token ${myToken}` };
  // const url = new URL(uploadUrl);
  // url.searchParams.append('name', fileName);
  // info(`URL: ${url.toString()}`);
  // const response = await octokit.request({
  //   method: 'POST',
  //   url: url.toString(),
  //   headers: headers,
  //   data: form
  // });

  return response;
}
