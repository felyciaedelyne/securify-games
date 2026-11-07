"""Model hibrida: (1) TF-IDF+LR untuk KATA, (2) fitur struktur angka/tautan, digabung oleh pohon boosting.

Stacking: peluang LR untuk data latih dihitung OUT-OF-FOLD (tiap contoh dinilai oleh LR yang tidak
pernah melihatnya) supaya pohon tidak belajar dari angka yang "bocor".
"""
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.preprocessing import FunctionTransformer

from fitur import normalisasi_batch
from fitur_struktur import matriks, NAMA


def buat_lr(C=10.0):
    return Pipeline([
        ("norm", FunctionTransformer(normalisasi_batch, validate=False)),
        ("tfidf", FeatureUnion([("kata", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True,
                                                         token_pattern=r"(?u)\b\w+\b"))])),
        ("clf", LogisticRegression(C=C, class_weight="balanced", max_iter=5000)),
    ])


class Hibrida:
    def __init__(self, C=10.0, seed=0):
        self.C, self.seed = C, seed

    def _gabung(self, teks, p_lr):
        return np.column_stack([matriks(teks), p_lr])

    def fit(self, teks, y, bobot=None):
        """bobot (opsional): bobot per contoh, mis. contoh Indonesia dibuat lebih berpengaruh."""
        teks, y = list(teks), np.asarray(y)
        kw = {} if bobot is None else {"clf__sample_weight": np.asarray(bobot, dtype=float)}
        oof = cross_val_predict(buat_lr(self.C), teks, y, cv=StratifiedKFold(5, shuffle=True, random_state=self.seed),
                                method="predict_proba", params=kw)[:, 1]
        self.lr = buat_lr(self.C).fit(teks, y, **kw)
        self.gb = HistGradientBoostingClassifier(max_depth=4, learning_rate=0.08, max_iter=250,
                                                 class_weight="balanced", random_state=self.seed)
        self.gb.fit(self._gabung(teks, oof), y, sample_weight=None if bobot is None else np.asarray(bobot, dtype=float))
        return self

    def predict_proba(self, teks):
        teks = list(teks)
        p_lr = self.lr.predict_proba(teks)[:, 1]
        return self.gb.predict_proba(self._gabung(teks, p_lr))

    def predict(self, teks):
        return (self.predict_proba(teks)[:, 1] >= 0.5).astype(int)