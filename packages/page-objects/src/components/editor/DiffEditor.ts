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

import { Editor } from './Editor';
import { TextEditor } from './TextEditor';
import { EditorView } from './EditorView';

/**
 * Page object representing a diff editor
 */
export class DiffEditor extends Editor {
	/**
	 * Gets the text editor corresponding to the originalside.
	 * (The left side of the diff editor)
	 * @returns Promise resolving to TextEditor object
	 */
	async getOriginalEditor(): Promise<TextEditor> {
		const element = await this.getEnclosingElement().findElement(DiffEditor.locators.DiffEditor.originalEditor);
		return new TextEditor(new EditorView(), element);
	}

	/**
	 * Gets the text editor corresponding to the modified side.
	 * (The right side of the diff editor)
	 * @returns Promise resolving to TextEditor object
	 */
	async getModifiedEditor(): Promise<TextEditor> {
		const element = await this.getEnclosingElement().findElement(DiffEditor.locators.DiffEditor.modifiedEditor);
		return new TextEditor(new EditorView(), element);
	}
}
