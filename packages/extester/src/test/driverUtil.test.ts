/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import assert from 'assert';
import { logging } from 'selenium-webdriver';
import { DriverUtil } from '../util/driverUtil';

describe('DriverUtil.chromeDriverLogLevelArgs', () => {
	it('maps INFO to --log-level=INFO with readable timestamps', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.INFO), ['--log-level=INFO', '--readable-timestamp']);
	});

	it('maps DEBUG to --log-level=DEBUG', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.DEBUG), ['--log-level=DEBUG', '--readable-timestamp']);
	});

	it('maps WARNING and SEVERE to their chromedriver levels', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.WARNING), ['--log-level=WARNING', '--readable-timestamp']);
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.SEVERE), ['--log-level=SEVERE', '--readable-timestamp']);
	});

	it('maps ALL and the FINE levels to --log-level=ALL (full CDP traffic)', () => {
		for (const level of [logging.Level.ALL, logging.Level.FINE, logging.Level.FINER, logging.Level.FINEST]) {
			assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(level), ['--log-level=ALL', '--readable-timestamp']);
		}
	});

	it('maps OFF to --log-level=OFF', () => {
		assert.deepStrictEqual(DriverUtil.chromeDriverLogLevelArgs(logging.Level.OFF), ['--log-level=OFF', '--readable-timestamp']);
	});
});
