<?php

namespace MusicBrainzTools\MusicBrainzApi;

interface MusicBrainzApiInterface
{

    /**
     * Returns work data for the given MBID as an associative array
     * @param string $mbid
     * @param array $includes
     * @return array
     */
    public function getWorkData(string $mbid, array $includes): array;

    /**
     * Returns artist data for the given MBID as
     * an associative array
     * @param string $mbid
     * @param string[] $includes
     * @return array
     */
    public  function getArtistData(string $mbid, array $includes) : array;

    /**
     * Returns  recordings associated with a given artist
     * @param string $mbid
     * @param int $offset
     * @return array
     */
    public function getRecordingsForArtist(string $mbid, int $offset = 0) : array;


    /**
     * Get recording data
     * @param string $mbid
     * @param array $includes
     * @return array
     */
    public function getRecordingData(string $mbid, array $includes) : array;


}