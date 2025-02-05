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

/**
 * Represents a test block, typically corresponding to a `describe` block in a test file.
 *
 * A `TestBlock` can contain nested child test blocks and individual test cases (`ItBlock`s).
 */
export interface TestBlock {
	describe: string; // name of the test block
	filePath: string; // file where this block is defined
	line: number; // line of occurrence
	modifier?: string | null; // optional: "skip" or "only"
	parentModifier?: string | null; // optional modifier inherited from a parent block
	its: ItBlock[]; // list of test cases in this block
	children: TestBlock[]; // nested test blocks
}

/**
 * Represents an individual test case, typically corresponding to an `it` block in a test file.
 */
export interface ItBlock {
	name: string; // name of the test case
	filePath: string; // file where this test case is defined
	line: number; // line of occurrence
	modifier?: string | null; // optional: "skip" or "only"
	parentModifier?: string | null; // optional modifier inherited from a parent block
	describeModifier?: string | null; // optional modifier inherited from the enclosing `describe`
}
