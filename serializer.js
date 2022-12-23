import { expect } from 'vitest';
import rawSnapshotSerializer from 'jest-snapshot-serializer-raw/always';

expect.addSnapshotSerializer(rawSnapshotSerializer);
