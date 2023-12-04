<?php

namespace MusicBrainzTools\Slim\Api;

use MusicBrainzTools\MusicBrainzApi\CachingMusicBrainzApiInterface;
use MusicBrainzTools\MusicBrainzApi\MusicBrainzApiInterface;
use MusicBrainzTools\Slim\Controller;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Log\NullLogger;

class MusicBrainz extends Controller
{

    private ?MusicBrainzApiInterface $api;

    public function __construct(ContainerInterface $ci)
    {
        parent::__construct($ci);

        $this->api = null;


    }

    protected function getApi() : MusicBrainzApiInterface {
        if ($this->api === null) {
            $this->api = new CachingMusicBrainzApiInterface($this->dataCache);
            $this->api->setLogger($this->logger->withName('MB_API'));
        }
        return $this->api;
    }

    public function getArtistData(ServerRequestInterface $request, ResponseInterface $response) : ResponseInterface
    {
        $mbid = $request->getAttribute('mbid', '');
        if ($mbid === '') {
            $this->logger->error("Empty mbid");
            return $this->responseWithStatus($response, 404);
        }
        $this->logger->info("Artist Data Request with MBID $mbid");
        try {
            $data = $this->getApi()->getArtistData($mbid, []);
        } catch(\Exception $e) {
            $this->logger->error('Exception trying to get data:' . $e->getMessage() );
            return $this->responseWithStatus($response, 502);
        }

        return $this->responseWithJson($response, json_encode($data));
    }

    public function getRecordingData(ServerRequestInterface $request, ResponseInterface $response) : ResponseInterface
    {
        $mbid = $request->getAttribute('mbid', '');
        if ($mbid === '') {
            $this->logger->error("Empty mbid");
            return $this->responseWithStatus($response, 404);
        }
        $this->logger->info("Artist Data Request with MBID $mbid");
        try {
            $data = $this->getApi()->getRecordingData($mbid, ['artists', 'releases', 'artist-rels']);
        } catch(\Exception $e) {
            $this->logger->error('Exception trying to get data:' . $e->getMessage() );
            return $this->responseWithStatus($response, 502);
        }
        return $this->responseWithJson($response, json_encode($data));
    }


    public function getRecordingsForArtist(ServerRequestInterface $request, ResponseInterface $response) : ResponseInterface
    {
        $mbid = $request->getAttribute('mbid', '');
        $offset = intval($request->getAttribute('offset', 0));
        if ($mbid === '') {
            $this->logger->error("Empty mbid");
            return $this->responseWithStatus($response, 404);
        }
        $this->logger->info("Artist Recordings Request with MBID $mbid, offset $offset");
        try {
            $data = $this->getApi()->getRecordingsForArtist($mbid, $offset);
        } catch(\Exception $e) {
            $this->logger->error('Exception trying to get data:' . $e->getMessage() );
            return $this->responseWithStatus($response, 502);
        }

        return $this->responseWithJson($response, json_encode($data));
    }

}