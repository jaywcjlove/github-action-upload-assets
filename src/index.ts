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
    const octokit = getOctokit(myToken);
    const release = await getReleaseURL(tagName)
    const downloadURLs = []
    for(let i = 0; i < files.length; i++) {
      const assetFile = files[i];
      // Determine content-length for header to upload asset
      const contentLength = (filePath: string) => fs.statSync(filePath).size;
      const contentType = 'application/octet-stream';
      //const contentType = "binary/octet-stream"
      // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/v20#repos-update-release-asset for more information
      const headers = { 
        'content-type': contentType, 
        'content-length': contentLength(assetFile)
      };
      const assetName = path.basename(assetFile);
      const data = fs.readFileSync(assetFile);
      // Upload a release asset
      // API Documentation: https://docs.github.com/en/rest/releases/releases?apiVersion=2022-11-28#update-a-release
      // Octokit Documentation: https://octokit.github.io/rest.js/v20#repos-update-release-asset
      const response = await octokit.rest.repos.uploadReleaseAsset({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: release.id,
        headers,
        name: assetName,
        data: data.toString()
      });
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