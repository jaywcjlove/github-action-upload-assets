import { context, getOctokit } from '@actions/github';
import { getInput, setOutput, setFailed, info } from '@actions/core';
import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

/**
 * get the release URL from the tag
 * @param tag 'v1.12.23'
 * @returns 
 */
async function getReleaseURL(tag: string | undefined) {
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

function getAssetName(assetPath: string): string | string[] | undefined {
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
async function uploadFile(owner: string, repo: string, releaseId: number, filePath: string) {
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

;(async () => {
  /**
   * Get the path to the file to upload
   */
  const assetPath = getAssetName(getInput('asset-path', { required: true }));
  const tagName: string | undefined = getInput('tag') || undefined;
  const myToken = getInput('token')
  try {
    if (!assetPath || assetPath.length === 0) {
      throw new Error('asset-path must contain a JSON array of quoted paths');
    }
    const files = await glob(assetPath, {})
    if (files.length === 0) {
      throw new Error('No files found');
    }
    const release = await getReleaseURL(tagName)
    const downloadURLs = []
    for(let i = 0; i < files.length; i++) {
      const assetFile = files[i];
      info(`Uploading asset(${context.repo.owner}/${context.repo.repo}): ${assetFile}`);
      const response = await uploadFile(context.repo.owner, context.repo.repo, release.id, assetFile);
      downloadURLs.push(response.data.browser_download_url)
      if (response.status < 200 || response.status > 299) {
        new Error(`Asset upload failed "${assetPath}. Response:" ${response}`)
      }
    }
    setOutput('browser_download_urls', JSON.stringify(downloadURLs));
  } catch (error) {
    setFailed(error as Error);
  }
})();