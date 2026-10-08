// DTD (Decode The Data) - Data Science Club JNTUH
// Challenge dataset and problem definitions

export const INITIAL_CATEGORIES = [
  {
    id: 'welcome',
    name: 'Welcome Track',
    shortName: 'welcome',
    icon: 'Sparkles',
    color: 'emerald',
    description: 'Introductory challenges to understand the platform and verification flows.'
  },
  {
    id: 'analysis',
    name: 'Data Analysis & Statistics',
    shortName: 'analysis',
    icon: 'BarChart3',
    color: 'indigo',
    description: 'Statistical reasoning, distribution anomalies, correlations, and exploratory findings.'
  },
  {
    id: 'cleaning',
    name: 'Data Cleaning & Preprocessing',
    shortName: 'cleaning',
    icon: 'Sparkles',
    color: 'sky',
    description: 'Missing values, deduplication, format fixes, outlier detection, and encoding.'
  },
  {
    id: 'ml',
    name: 'Machine Learning & Modeling',
    shortName: 'ml',
    icon: 'Bot',
    color: 'purple',
    description: 'Classification traps, regression metrics, model selection, and feature importance.'
  },
  {
    id: 'investigation',
    name: 'Data Forensics & Hidden Signals',
    shortName: 'investigation',
    icon: 'Search',
    color: 'amber',
    description: 'Investigative challenges with steganographic patterns, encoded payloads, and clues.'
  },
  {
    id: 'deeplearning',
    name: 'Deep Learning & AI Reasoning',
    shortName: 'deeplearning',
    icon: 'Brain',
    color: 'rose',
    description: 'Vector embeddings, attention patterns, latent spaces, and AI clues.'
  }
];

export const INITIAL_CHALLENGES = [
  // WELCOME LEVEL - IDENTITY SYNC (Instagram Follow & Token Extraction - NO CLUES GIVEN)
  {
    id: 'welcome-01',
    title: 'DSC Identity Sync',
    category: 'welcome',
    difficulty: 'Welcome',
    points: 50,
    author: 'Data Science Club JNTUH',
    likes: 48,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
Welcome to **DTD — Decode The Data**! To register your squad on the live tournament leaderboard, your squad must establish verification with the Data Science Club network.

---

### 🎯 What Is The Problem & Objective?
Head over to our official club Instagram page:
👉 **[@datascienceclubjntuh](https://www.instagram.com/datascienceclubjntuh/)**

Somewhere on our Instagram account, an authentication code is waiting to be uncovered. You have to hunt down where it is hidden yourself. Inspect the page, find the code, and submit the decoded solution.

---

### 📝 Submission Format
Submit your decoded solution in the format:
\`DTD{code_you_found}\`
*(Or enter the secret code found on our Instagram page)*`,
    flagFormat: 'DTD{code_name}',
    acceptedKeys: [
      'DTD{datascienceclubjntuh}',
      'datascienceclubjntuh',
      'DTD{ds_club_jntuh}',
      'ds_club_jntuh',
      'DTD{welcome_to_ds_club_2026}',
      'welcome_to_ds_club_2026',
      'DTD{ds_club_verified}',
      'ds_club_verified',
      'DTD{decode_the_data}',
      'decode_the_data'
    ],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: false,
    instagramLink: 'https://www.instagram.com/datascienceclubjntuh/',
    hints: [], // NO CLUES FOR THE FIRST INSTAGRAM QUESTION
    sampleRows: [
      { platform: 'Instagram', handle: '@datascienceclubjntuh', status: 'Beacon Active' }
    ]
  },
  {
    id: 'welcome-02',
    title: 'The CSV Hello World',
    category: 'welcome',
    difficulty: 'Welcome',
    points: 50,
    author: 'Data Science Club JNTUH',
    likes: 31,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
Telemetry sensors continuously log system status across our computing cluster. During initialization, one specific sensor logged a calibration benchmark code.

---

### 🎯 What Is The Problem & Objective?
1. Download the attached dataset \`starter_telemetry.csv\`.
2. Inspect the rows to locate the sensor with ID **\`SENSOR_99\`**.
3. Combine its \`status\` value and \`reading\` numerical value separated by an underscore.
4. Submit the decoded solution formatted as: \`DTD{STATUS_READING}\`.

Example: If status is ACTIVE and reading is 404, the solution is \`DTD{ACTIVE_404}\`.`,
    flagFormat: 'DTD{STATUS_READING}',
    acceptedKeys: ['DTD{CALIBRATED_8192}', 'CALIBRATED_8192'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'starter_telemetry.csv',
    datasetContent: `sensor_id,timestamp,location,status,reading,voltage
SENSOR_01,2026-10-08T08:00:00Z,Lab_A,IDLE,120,3.3
SENSOR_02,2026-10-08T08:00:01Z,Lab_B,ACTIVE,450,3.3
SENSOR_99,2026-10-08T08:00:15Z,Server_Room,CALIBRATED,8192,5.0
SENSOR_03,2026-10-08T08:00:30Z,Lab_C,STANDBY,200,3.2`,
    hints: [
      { id: 1, cost: 10, text: 'You just got scammed! -10 points. Paying 10 points on a 50-point warmup question? There is no free clue here. Open the CSV and locate SENSOR_99.' },
      { id: 2, cost: 20, text: 'Look at the row where sensor_id is SENSOR_99. The status is CALIBRATED and reading is 8192.' }
    ],
    sampleRows: [
      { sensor_id: 'SENSOR_01', status: 'IDLE', reading: '120', voltage: '3.3' },
      { sensor_id: 'SENSOR_02', status: 'ACTIVE', reading: '450', voltage: '3.3' },
      { sensor_id: 'SENSOR_99', status: 'CALIBRATED', reading: '8192', voltage: '5.0' },
      { sensor_id: 'SENSOR_03', status: 'STANDBY', reading: '200', voltage: '3.2' }
    ]
  },

  // DATA ANALYSIS & STATISTICS
  {
    id: 'analysis-01',
    title: 'Spot the Outlier',
    category: 'analysis',
    difficulty: 'Beginner',
    points: 100,
    author: 'Data Science Club',
    likes: 38,
    dislikes: 1,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
A factory boiler temperature monitoring system logs temperatures hourly. Under regular operation, values fluctuate safely between 65°C and 74°C.

During a cooling valve failure, an extreme temperature spike occurred, registering far beyond 3.5 Interquartile Ranges (IQR) from the third quartile.

---

### 🎯 What Is The Problem & Objective?
1. Download \`factory_temperatures.csv\` or inspect the data table below.
2. Calculate or identify the single anomalous timestamp where the critical spike took place.
3. Submit the decoded solution formatted as: \`DTD{YYYY-MM-DD_HH:MM}\`.`,
    flagFormat: 'DTD{YYYY-MM-DD_HH:MM}',
    acceptedKeys: ['DTD{2026-09-14_03:45}', '2026-09-14_03:45'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'factory_temperatures.csv',
    datasetContent: `timestamp,zone,temperature_c,pressure_psi,status
2026-09-14_01:00,Boiler_1,68.2,14.5,NORMAL
2026-09-14_02:00,Boiler_1,69.1,14.6,NORMAL
2026-09-14_03:00,Boiler_1,71.0,14.7,NORMAL
2026-09-14_03:45,Boiler_1,194.8,38.2,CRITICAL_SPIKE
2026-09-14_04:00,Boiler_1,72.4,14.9,NORMAL
2026-09-14_05:00,Boiler_1,67.8,14.4,NORMAL`,
    hints: [
      { id: 1, cost: 15, text: 'You got scammed! -15 points penalty applied. You really thought we would spoon-feed you the outlier for free? There is no clue here. Calculate IQR yourself.' },
      { id: 2, cost: 25, text: 'Still burning points? Fine: Sort the temperature column descending. An operating temperature above 190°C is an obvious massive spike.' },
      { id: 3, cost: 35, text: 'The anomalous reading occurred on 2026-09-14 at 03:45. Format: DTD{2026-09-14_03:45}.' }
    ],
    sampleRows: [
      { timestamp: '2026-09-14_01:00', zone: 'Boiler_1', temperature_c: '68.2', status: 'NORMAL' },
      { timestamp: '2026-09-14_03:45', zone: 'Boiler_1', temperature_c: '194.8', status: 'CRITICAL_SPIKE' },
      { timestamp: '2026-09-14_05:00', zone: 'Boiler_1', temperature_c: '67.8', status: 'NORMAL' }
    ]
  },
  {
    id: 'analysis-02',
    title: 'The Correlation Trap',
    category: 'analysis',
    difficulty: 'Intermediate',
    points: 200,
    author: 'Data Science Club',
    likes: 27,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
Financial algorithms track 8 anonymized quantitative market metrics (\`col_A\` through \`col_H\`).

An algorithmic audit discovered that two columns have a Pearson correlation coefficient of almost perfect negative linearity ($r < -0.99$), indicating that one is an inverted mirror of the other.

---

### 🎯 What Is The Problem & Objective?
1. Download \`financial_signals.csv\`.
2. Compute the Pearson correlation matrix across all 8 columns.
3. Identify the two column names that form this strong negative correlation.
4. Arrange the column names in alphabetical order joined by an underscore.
5. Submit in the format: \`DTD{COL_X_COL_Y}\`.`,
    flagFormat: 'DTD{COL_X_COL_Y}',
    acceptedKeys: ['DTD{COL_C_COL_F}', 'COL_C_COL_F', 'DTD{COL_F_COL_C}'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'financial_signals.csv',
    datasetContent: `col_A,col_B,col_C,col_D,col_E,col_F,col_G,col_H
12.4,45.1,100.5,0.22,8.9,-100.4,15.2,88.1
14.1,43.2,95.2,0.31,9.1,-95.1,14.8,87.9
11.9,46.0,88.4,0.18,8.7,-88.3,16.0,89.2
15.0,42.8,112.1,0.44,9.3,-112.0,14.1,86.5
13.3,44.5,105.8,0.29,9.0,-105.7,15.5,88.0`,
    hints: [
      { id: 1, cost: 20, text: 'You just paid 20 points for nothing! You got scammed. Real data scientists write df.corr() instead of begging for shortcuts.' },
      { id: 2, cost: 35, text: 'Two of the columns are virtually identical, except one is multiplied by negative one. Look for symmetric inverted values.' },
      { id: 3, cost: 50, text: 'Inspect col_C and col_F. When col_C is +100.5, col_F is -100.4. Format: DTD{COL_C_COL_F}.' }
    ],
    sampleRows: [
      { col_A: '12.4', col_C: '100.5', col_D: '0.22', col_F: '-100.4', correlation: 'r = -0.999' }
    ]
  },
  {
    id: 'analysis-03',
    title: 'Simpson’s Paradox',
    category: 'analysis',
    difficulty: 'Advanced',
    points: 350,
    author: 'Data Science Club',
    likes: 22,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
A hospital trial reported aggregated patient recovery data for Drug Alpha vs Drug Beta. At the aggregate level, Drug Alpha seems inferior.

However, when stratifying patients by condition severity (\`Mild\`, \`Moderate\`, \`Severe\`), Drug Alpha actually demonstrates higher efficacy in each individual group!

---

### 🎯 What Is The Problem & Objective?
1. Download \`drug_trials_segmented.csv\`.
2. Filter the dataset specifically for patients who received **Drug Alpha** and had **Severe** condition.
3. Calculate the exact recovery percentage: $(\\text{recovered count} / \\text{total cohort}) \\times 100$.
4. Format to 1 decimal place with a percent sign: \`DTD{XX.X%}\`.`,
    flagFormat: 'DTD{XX.X%}',
    acceptedKeys: ['DTD{41.7%}', '41.7%', 'DTD{41.7}', '41.7'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'drug_trials_segmented.csv',
    datasetContent: `patient_id,drug,severity,recovered
P101,Alpha,Severe,1
P102,Alpha,Severe,0
P103,Alpha,Severe,1
P104,Alpha,Severe,0
P105,Alpha,Severe,0
P106,Alpha,Severe,1
P107,Alpha,Severe,0
P108,Alpha,Severe,0
P109,Alpha,Severe,1
P110,Alpha,Severe,0
P111,Alpha,Severe,1
P112,Alpha,Severe,0`,
    hints: [
      { id: 1, cost: 25, text: 'You got scammed! -25 points burned. Imagine asking for hints on Simpson\'s Paradox. Filter the severe cohort and do basic division.' },
      { id: 2, cost: 50, text: 'There are 12 patients in the Severe Drug Alpha group. Count the 1s in recovered: exactly 5 recovered. 5 / 12 = 41.666% -> 41.7%.' }
    ],
    sampleRows: [
      { patient_id: 'P101', drug: 'Alpha', severity: 'Severe', recovered: '1' },
      { patient_id: 'P102', drug: 'Alpha', severity: 'Severe', recovered: '0' }
    ]
  },

  // DATA CLEANING & PREPROCESSING
  {
    id: 'cleaning-01',
    title: 'Ghost Duplicates',
    category: 'cleaning',
    difficulty: 'Beginner',
    points: 100,
    author: 'Data Science Club',
    likes: 19,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
A conference attendee registration log suffered from database synchronization glitches. Due to mixed casing and trailing whitespace issues, duplicates were masked as distinct entries.

---

### 🎯 What Is The Problem & Objective?
1. Download \`registrations_dirty.csv\`.
2. Clean the \`user_hash\` column by stripping leading/trailing whitespace and converting all letters to lowercase.
3. Count the total number of **unique** participants in the cleaned dataset.
4. Submit in the format: \`DTD{count}\` (e.g. \`DTD{218}\`).`,
    flagFormat: 'DTD{count}',
    acceptedKeys: ['DTD{218}', '218'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'registrations_dirty.csv',
    datasetContent: `reg_id,user_hash,timestamp
1,usr_92a1 ,2026-10-01
2,USR_92A1,2026-10-02
3,usr_77bc,2026-10-02
4, usr_77bc ,2026-10-03
5,usr_1100,2026-10-03`,
    hints: [
      { id: 1, cost: 15, text: 'Did you just spam the hint button? You got scammed! -15 points penalty. There are no free shortcuts in data cleaning.' },
      { id: 2, cost: 25, text: 'Invisible whitespaces trick string equality in Python. Apply .str.strip().str.lower() before calling .nunique().' },
      { id: 3, cost: 40, text: 'The unique count is 218. Format: DTD{218}.' }
    ],
    sampleRows: [
      { reg_id: '1', user_hash: 'usr_92a1 ', note: 'Trailing whitespace' },
      { reg_id: '2', user_hash: 'USR_92A1', note: 'Uppercase duplicate' }
    ]
  },
  {
    id: 'cleaning-02',
    title: 'The Missing Imputation',
    category: 'cleaning',
    difficulty: 'Intermediate',
    points: 180,
    author: 'Data Science Club',
    likes: 17,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
In healthcare telemetry, patient blood glucose levels often experience dropouts due to sensor disconnection.

Standard medical data preprocessing protocols require missing values to be imputed with the **cohort median** for the patient's specific age group.

---

### 🎯 What Is The Problem & Objective?
1. Download \`medical_census_glucose.csv\`.
2. Inspect patient **\`MED_808\`** who belongs to the \`36-50\` age group and has a missing glucose reading.
3. Calculate the median blood glucose level of all valid readings in the \`36-50\` cohort.
4. Submit the rounded integer median in format: \`DTD{MEDIAN_VALUE}\`.`,
    flagFormat: 'DTD{VALUE}',
    acceptedKeys: ['DTD{114}', '114'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'medical_census_glucose.csv',
    datasetContent: `patient_id,age_group,blood_glucose
MED_801,36-50,110
MED_802,36-50,114
MED_803,36-50,122
MED_804,36-50,108
MED_808,36-50,NaN
MED_809,36-50,118`,
    hints: [
      { id: 1, cost: 20, text: 'You got scammed! Point deduction confirmed (-20 pts). Begging for median calculations in a competition is wild.' },
      { id: 2, cost: 35, text: 'Filter by age_group "36-50", discard the NaN, sort the numbers: [108, 110, 114, 118, 122]. Find the middle value.' },
      { id: 3, cost: 50, text: 'The median value is 114. Submit DTD{114}.' }
    ],
    sampleRows: [
      { patient_id: 'MED_801', age_group: '36-50', blood_glucose: '110' },
      { patient_id: 'MED_808', age_group: '36-50', blood_glucose: 'NaN (Impute)' }
    ]
  },

  // MACHINE LEARNING & MODELING
  {
    id: 'ml-01',
    title: 'Metric Mirage',
    category: 'ml',
    difficulty: 'Beginner',
    points: 120,
    author: 'Data Science Club',
    likes: 29,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
A credit card fraud detection classifier was deployed on an imbalanced dataset containing 9,900 Legitimate transactions and 100 Fraudulent transactions.

The naive model learned to predict **"Legitimate" for 100% of cases**, achieving 99% overall accuracy.

---

### 🎯 What Is The Problem & Objective?
1. What is the model's **Recall** on the positive (Fraud) class?
2. Recall is defined as: $\\text{Recall} = \\frac{\\text{True Positives}}{\\text{True Positives} + \\text{False Negatives}}$.
3. Since True Positives is 0, enter the numeric decimal value between 0.0 and 1.0.
4. Format: \`DTD{0.X}\`.`,
    flagFormat: 'DTD{0.X}',
    acceptedKeys: ['DTD{0.0}', '0.0', 'DTD{0}', '0'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: false,
    hints: [
      { id: 1, cost: 15, text: 'You just got scammed! -15 points penalty. If a model predicts zero positive cases, do you really need a hint to know what True Positives equals?' },
      { id: 2, cost: 30, text: 'Zero true positives caught means the numerator is 0. 0 / 100 = 0.0. Format: DTD{0.0}.' }
    ],
    sampleRows: [
      { total_samples: 10000, actual_fraud: 100, predicted_fraud: 0, true_positives: 0 }
    ]
  },
  {
    id: 'ml-02',
    title: 'Feature Overload',
    category: 'ml',
    difficulty: 'Intermediate',
    points: 220,
    author: 'Data Science Club',
    likes: 18,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
An XGBoost regression model was trained to predict network ping latency. The decision tree ensemble logged feature importance based on fractional split Gain.

One feature proved overwhelmingly influential, accounting for **48.6% of the total gain**.

---

### 🎯 What Is The Problem & Objective?
1. Download \`model_weights_xgboost.json\`.
2. Inspect the \`feature_importance_gain\` object.
3. Identify the dominant feature name.
4. Format: \`DTD{feature_name}\`.`,
    flagFormat: 'DTD{feature_name}',
    acceptedKeys: ['DTD{packet_queue_depth}', 'packet_queue_depth'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'model_weights_xgboost.json',
    datasetContent: `{
  "model_type": "XGBRegressor",
  "feature_importance_gain": {
    "num_hops": 0.042,
    "payload_bytes": 0.081,
    "packet_queue_depth": 0.486,
    "jitter_variance": 0.112,
    "ttl_remaining": 0.035,
    "buffer_pressure": 0.154,
    "cpu_cycles": 0.090
  }
}`,
    hints: [
      { id: 1, cost: 25, text: 'You just spammed the hint button and burned 25 points! You got scammed. Open the JSON file in any text editor.' },
      { id: 2, cost: 45, text: 'Look for the float 0.486. The corresponding key is packet_queue_depth. Format: DTD{packet_queue_depth}.' }
    ],
    sampleRows: [
      { feature: 'packet_queue_depth', gain: '0.486 (48.6%)', rank: '#1 Dominant' }
    ]
  },

  // DATA FORENSICS & HIDDEN SIGNALS
  {
    id: 'investigation-01',
    title: 'Double Take',
    category: 'investigation',
    difficulty: 'Intermediate',
    points: 200,
    author: 'Data Science Club',
    likes: 42,
    dislikes: 1,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
A machine learning engineer created an authentication hash using Python's SHA-256 algorithm.

The engineer hashed their favorite Python Machine Learning library name concatenated with \`_master\`:
\`\`\`
2c271d8b0076158765c8536c47c4d8d0a59d0d2a3464adddff3a09097804d3bc
\`\`\`

---

### 🎯 What Is The Problem & Objective?
1. Download the clue log \`hash_clues.txt\`.
2. Reverse or inspect the clue file to determine the decoded library target string.
3. Format: \`DTD{word}\`.`,
    flagFormat: 'DTD{word}',
    acceptedKeys: ['DTD{scikit_learn_master}', 'scikit_learn_master'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'hash_clues.txt',
    datasetContent: `Clue Notes:
Digest: 2c271d8b0076158765c8536c47c4d8d0a59d0d2a3464adddff3a09097804d3bc
Algorithm: SHA-256
Input: Canonical python machine learning library + '_master'
Decoded Target Word: scikit_learn_master`,
    hints: [
      { id: 1, cost: 25, text: 'You got scammed! -25 points. You expected the cracked hash delivered on a silver platter? Read the clue file.' },
      { id: 2, cost: 45, text: 'The target word is Dan’s favorite Python ML library scikit_learn followed by _master: scikit_learn_master.' }
    ],
    sampleRows: [
      { hash_type: 'SHA-256', target_domain: 'Python ML Tools' }
    ]
  },
  {
    id: 'investigation-02',
    title: 'Steganographic Residuals',
    category: 'investigation',
    difficulty: 'Advanced',
    points: 300,
    author: 'Data Science Club',
    likes: 31,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
A linear regression model was trained: $\\hat{y} = 2.5x + 10$.

While the predictions appear completely standard, someone embedded an ASCII secret cipher inside the residual variation metadata.

---

### 🎯 What Is The Problem & Objective?
1. Download \`linear_residuals.csv\`.
2. Examine the \`residual_ascii_char\` column across the 12 samples.
3. Concatenate the letters in order to reconstruct the hidden analytical phrase.
4. Format: \`DTD{SECRET_WORD}\`.`,
    flagFormat: 'DTD{SECRET_WORD}',
    acceptedKeys: ['DTD{EIGEN_VECTOR}', 'EIGEN_VECTOR'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: true,
    datasetFileName: 'linear_residuals.csv',
    datasetContent: `sample_idx,x_val,y_true,y_pred,residual_ascii_char
1,1.0,12.5,12.5,E
2,2.0,15.0,15.0,I
3,3.0,17.5,17.5,G
4,4.0,20.0,20.0,E
5,5.0,22.5,22.5,N
6,6.0,25.0,25.0,_
7,7.0,27.5,27.5,V
8,8.0,30.0,30.0,E
9,9.0,32.5,32.5,C
10,10.0,35.0,35.0,T
11,11.0,37.5,37.5,O
12,12.0,40.0,40.0,R`,
    hints: [
      { id: 1, cost: 30, text: 'Curiosity tax paid: -30 points! You got scammed. No hints here. Inspect the residual characters in the dataset rows.' },
      { id: 2, cost: 60, text: 'Read the residual_ascii_char column vertically top to bottom: E-I-G-E-N-_-V-E-C-T-O-R. Submit DTD{EIGEN_VECTOR}.' }
    ],
    sampleRows: [
      { idx: 1, char: 'E' },
      { idx: 2, char: 'I' },
      { idx: 3, char: 'G' },
      { idx: 4, char: 'E' },
      { idx: 5, char: 'N' }
    ]
  },

  // DEEP LEARNING & AI REASONING
  {
    id: 'deeplearning-01',
    title: 'Latent Distance',
    category: 'deeplearning',
    difficulty: 'Intermediate',
    points: 250,
    author: 'Data Science Club',
    likes: 25,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
In vector semantics (such as Word2Vec and GloVe), word representations exhibit additive compositional properties.

---

### 🎯 What Is The Problem & Objective?
1. Evaluate the canonical semantic vector analogy equation:
   $$\\vec{v}_{\\text{result}} = \\vec{v}(\\text{King}) - \\vec{v}(\\text{Man}) + \\vec{v}(\\text{Woman})$$
2. Which English word vector has the highest Cosine Similarity to $\\vec{v}_{\\text{result}}$?
3. Format: \`DTD{Word}\`.`,
    flagFormat: 'DTD{Word}',
    acceptedKeys: ['DTD{Queen}', 'Queen', 'DTD{QUEEN}', 'QUEEN'],
    isReleased: true,
    releaseTime: 'Released Live',
    hasDataset: false,
    hints: [
      { id: 1, cost: 25, text: 'You just got scammed for 25 points! If you don\'t know the most famous Word2Vec paper equation in AI history, Google Mikolov 2013.' },
      { id: 2, cost: 50, text: 'King is to Man as Queen is to Woman. Submit DTD{Queen}.' }
    ],
    sampleRows: [
      { analogy: 'King - Man + Woman', target: 'Queen' }
    ]
  },
  {
    id: 'deeplearning-02',
    title: 'Attention Mirage',
    category: 'deeplearning',
    difficulty: 'Advanced',
    points: 450,
    author: 'Data Science Club',
    likes: 20,
    dislikes: 0,
    solvesCount: 0,
    problemStatement: `### 📌 Problem Context
In a multi-head Transformer encoder, attention heads specialize in distinct linguistic dependencies. Head 3 is responsible for coreference resolution.

We passed the prompt sentence:
*"The autonomous agent decoded the cipher because it understood data science."*

---

### 🎯 What Is The Problem & Objective?
1. Download \`transformer_attention_head3.json\`.
2. Inspect the attention distribution for the query token **"it"**.
3. Identify which antecedent token receives the dominant softmax attention weight (0.84).
4. Format: \`DTD{token}\`.`,
    flagFormat: 'DTD{token}',
    acceptedKeys: ['DTD{agent}', 'agent'],
    isReleased: false,
    releaseTime: 'Coming Soon at 02:00 PM',
    hasDataset: true,
    datasetFileName: 'transformer_attention_head3.json',
    datasetContent: `{
  "layer": 4,
  "head": 3,
  "query_token": "it",
  "attention_weights": {
    "The": 0.02,
    "autonomous": 0.05,
    "agent": 0.84,
    "decoded": 0.03,
    "cipher": 0.04,
    "because": 0.02
  }
}`,
    hints: [
      { id: 1, cost: 30, text: 'You got scammed! -30 points. No free clues on Advanced Transformer challenges.' },
      { id: 2, cost: 60, text: 'Look at the query token "it" attending to "agent" with 0.84 weight. Submit DTD{agent}.' }
    ],
    sampleRows: [
      { query: 'it', highest_attention: 'agent (0.84)' }
    ]
  }
];

export const INITIAL_TEAMS = [];
export const INITIAL_USERS = [];
