<?php

namespace MusicBrainzTools\MusicBrainzApi;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Log\LoggerAwareInterface;
use Psr\Log\LoggerAwareTrait;
use Psr\Log\NullLogger;
use ThomasInstitut\DataCache\DataCache;
use ThomasInstitut\DataCache\KeyNotInCacheException;

class CachingMusicBrainzApiInterface implements MusicBrainzApiInterface, LoggerAwareInterface
{

    use LoggerAwareTrait;

    const API_BASE_URL = "https://musicbrainz.org/ws/2/";


    private DataCache $cache;
    private string $cachePrefix;
    /**
     * @var Client|null
     */
    private ?Client $guzzleClient;
    private int $ttl;
    private string $lastMbApiCallCacheKey;
    private string $mbApiLock;

    public function __construct(DataCache $cache, int $cacheTtl = 86400, string $cachePrefix = 'mba-')
    {
        $this->cache = $cache;
        $this->cachePrefix = $cachePrefix;
        $this->guzzleClient = null;
        $this->ttl = $cacheTtl;
        $this->setLogger(new NullLogger());
        $this->lastMbApiCallCacheKey = $this->cachePrefix . "-last-mb-api-call";
        $this->mbApiLock = $this->cachePrefix . '-api-lock';
    }

    private function getGuzzleClient() : Client {
        if ($this->guzzleClient === null) {
            $this->guzzleClient = new Client([
                    'base_uri' => self::API_BASE_URL,
                    'timeout'  => 5.0,
                ]
            );
        }
        return $this->guzzleClient;
    }

    /**
     * @throws GuzzleException
     */
    private function getEntityData(string $entity, string $mbid, array $includes) : array {
        $cacheKey = $this->getCacheKey($entity, '', $mbid, $includes);

        try {
            $data = unserialize($this->cache->get($cacheKey));
        } catch (KeyNotInCacheException) {
            $data = $this->doGetEntityData($entity, $mbid, $includes);
            $this->cache->set($cacheKey, serialize($data), $this->ttl);
        }
        return $data;
    }

    /**
     * @throws GuzzleException
     */
    private function doBrowseData(string $entity, string $relatedEntity, string $relatedEntityMbid, array $includes, int $offset) : array {
        $uri = "$entity?$relatedEntity=$relatedEntityMbid&fmt=json&offset=$offset";
        if (count($includes) !== 0) {
            $uri .= '&inc=' .implode('+', $includes);
        }
        return $this->getFromMusicBrainz($uri);
    }

    private function getCacheKey(string $entity, string $entity2, string $mbid, array $includes) : string {
        $sep = '-';
        return $this->cachePrefix . $entity . $sep. $entity2. $sep . $mbid . $sep . implode($sep, $includes);
    }

    /**
     * @throws GuzzleException
     */
    private function doGetEntityData(string $entity, string $mbid, array $includes) : array {
        $uri = "$entity/$mbid?fmt=json";
        if (count($includes) !== 0) {
            $uri .= '&inc=' . implode('+', $includes);
        }
        return $this->getFromMusicBrainz($uri);
    }

    private function getApiLock() : bool {
        $lock = 'lock';
        try {
            $lock = $this->cache->get($this->mbApiLock);

        } catch (KeyNotInCacheException) {
            $this->cache->set($this->mbApiLock, "lock-" . time());
            return true;
        }
        if ($lock === '') {
            $this->cache->set($this->mbApiLock, "lock-" . time());
            return true;
        }
        return false;
    }

    private function releaseApiLock() : void {
        $this->cache->set($this->mbApiLock, '');
    }


    /**
     * @throws GuzzleException
     */
    private function getFromMusicBrainz(string $uri) : array {

        $lock = $this->getApiLock();
        $attempts = 1;
        while (!$lock) {
            $attempts++;
            if ($attempts >= 5) {
                throw new \RuntimeException("Cannot get api lock, tried $attempts times");
            }
            $this->logger->debug("Waiting 1 second to try to get api lock in attempt no. $attempts");
            sleep(1);
            $lock = $this->getApiLock();
        }
        $client = $this->getGuzzleClient();
        try {
            $lastTime  = unserialize($this->cache->get($this->lastMbApiCallCacheKey));
        } catch (KeyNotInCacheException) {
            $lastTime = 0;
        }
        $now = time();
        if ($now - $lastTime < 2) {
            $this->logger->debug("Waiting 2 seconds to keep MB happy");
            sleep(2);
        }

        $this->cache->set($this->lastMbApiCallCacheKey, serialize(time()));
        $this->logger->debug("Querying MB with uri '$uri'");
        try {
            $response = $client->get($uri);
        } catch (GuzzleException $e) {
            $this->releaseApiLock();
            throw $e;
        }
        $this->releaseApiLock();
        $json = $response->getBody();

        return json_decode($json, true);
    }

    /**
     * @inheritDoc
     * @throws GuzzleException
     */
    public function getArtistData(string $mbid, array $includes): array
    {
        return $this->getEntityData('artist', $mbid, $includes);
    }

    /**
     * @throws GuzzleException
     */
    public function getRecordingsForArtist(string $mbid, int $offset = 0): array
    {
        $cacheKey = $this->getCacheKey('recording', 'artist', $mbid, [ "offset_$offset"]);
        try {
            $data = unserialize($this->cache->get($cacheKey));
        } catch (KeyNotInCacheException) {
            $data  = $this->doBrowseData('recording', 'artist', $mbid, [ 'artist-credits' ], $offset);
            $this->cache->set($cacheKey, serialize($data), $this->ttl);
        }
        return $data;
    }

    /**
     * @throws GuzzleException
     */
    public function getRecordingData(string $mbid, array $includes): array
    {
        return $this->getEntityData('recording', $mbid, $includes);
    }
}