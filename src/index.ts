import { context } from '@actions/github';
import { getInput, setFailed, setOutput, info } from '@actions/core';
import { glob } from 'glob';
import { getAssetName, getReleaseURL, uploadFile } from './utils';

;(async () => {
  /**
   * Get the path to the file to upload
   */
  const assetPath = getAssetName(getInput('asset-path', { required: true }));
  const tagName: string | undefined = getInput('tag') || undefined;
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
    if (error instanceof Error) {
      info(`Error: ${error.message}`);
    }
    setFailed(error as Error);
  }
})();